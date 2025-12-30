import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, combineLatest, map, switchMap, tap, of, catchError, take, merge, filter, fromEvent } from 'rxjs';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { NotificationService } from './notification.service';
import { Conversation, ChatMessage, ChatUser } from '../models/chat.interface';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _api = inject(ApiService);
  private _authService = inject(AuthService);
  private _usersService = inject(UsersService);
  private _notificationService = inject(NotificationService);
  private _snackBar = inject(MatSnackBar);

  private readonly CHANNEL_NAME = 'elementar_chat_channel';
  private _broadcastChannel: BroadcastChannel;
  private socket: any;

  // State
  private _conversations$ = new BehaviorSubject<Conversation[]>([]);
  private _activeConversationId$ = new BehaviorSubject<string | null>(null);
  private _messages$ = new BehaviorSubject<ChatMessage[]>([]);
  private _totalUnreadCount$ = new BehaviorSubject<number>(0);
  private _isMessengerOpen = false;

  // Public Selectors
  conversations$ = this._conversations$.asObservable();
  activeConversationId$ = this._activeConversationId$.asObservable();
  activeMessages$ = this._messages$.asObservable();
  totalUnreadCount$ = this._totalUnreadCount$.asObservable();

  constructor() {
    this._broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this._setupBroadcastListener();
    this._initSocket();
    this._loadConversations();
    this._loadUnreadCount();
  }

  setMessengerActive(isActive: boolean) {
    this._isMessengerOpen = isActive;
    if (isActive && this._activeConversationId$.value) {
      this.markConversationAsRead(this._activeConversationId$.value);
    }
  }

  private _loadUnreadCount() {
    const user = this._authService.getUser();
    if (!user) return;
    this._api.get<{ count: number }>('/chat/unread-count').subscribe({
      next: (res) => this._totalUnreadCount$.next(res.count),
      error: () => this._totalUnreadCount$.next(0)
    });
  }

  private _initSocket() {
    const user = this._authService.getUser();
    if (!user) return;

    import('socket.io-client').then((socketIoModule) => {
      const io = (socketIoModule as any).io || (socketIoModule as any).default;
      this.socket = io('http://localhost:3333', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        if (user) this.socket.emit('join', user.id);
      });

      this.socket.on('new_message', (msg: any) => {
        const mapped: ChatMessage = {
          ...msg,
          senderName: msg.sender?.name || 'Unknown',
          senderAvatar: msg.sender?.avatar || '',
          senderId: msg.senderId
        };
        this._handleIncomingMessage(mapped);
      });

      this.socket.on('conversation_updated', (payload: any) => {
        this._handleConversationUpdate(payload);
      });

      this.socket.on('conversation_created', (conv: Conversation) => {
        this._handleConversationCreated(conv);
      });

      this.socket.on('message_status_update', (payload: any) => {
        this._handleStatusUpdate(payload);
      });
    });
  }

  private _handleIncomingMessage(msg: ChatMessage) {
    const user = this._authService.getUser();
    if (user && msg.senderId === user.id) {
      // Ignore own messages for Notifications/Badges
      return;
    }

    // Acknowledge Delivery
    this._markAsDelivered(msg.conversationId);

    const activeId = this._activeConversationId$.value;
    const isActiveConv = activeId === msg.conversationId;

    // 1. If visible and active, mark read immediately
    if (this._isMessengerOpen && isActiveConv) {
      this._appendMessage(msg);
      this.markConversationAsRead(msg.conversationId);
    } else {
      // 2. Otherwise/Background: Increment Badge and/or Toast
      this._totalUnreadCount$.next(this._totalUnreadCount$.value + 1);

      // Show Toast if NOT in messenger (or if in messenger but different conversation)
      if (!this._isMessengerOpen) {
        this._showToast(msg);
      }

      // If we are in messenger but different conversation, also maybe toast?
      if (this._isMessengerOpen && !isActiveConv) {
        this._showToast(msg);
      }
    }

    this._updateLocalConversationPreview(msg.conversationId, msg);
  }

  private _handleStatusUpdate(payload: { conversationId: string, status: 'delivered' | 'read', actorId: number }) {
    const currentMsgs = this._messages$.value;
    const updated = currentMsgs.map(m => {
      if (m.conversationId !== payload.conversationId) return m;

      // If I sent it, update its status
      const user = this._authService.getUser();
      if (user && m.senderId === user.id) {
        if (payload.status === 'read') return { ...m, status: 'read' } as ChatMessage;
        if (payload.status === 'delivered' && m.status !== 'read') return { ...m, status: 'delivered' } as ChatMessage;
      }
      return m;
    });

    this._messages$.next(updated);
  }

  private _markAsDelivered(conversationId: string) {
    this._api.post(`/chat/conversations/${conversationId}/delivered`, {}).subscribe();
  }

  private _appendMessage(msg: ChatMessage) {
    const currentMsgs = this._messages$.value;
    // Dedupe
    if (!currentMsgs.find(m => m.id === msg.id)) {
      this._messages$.next([...currentMsgs, msg]);
    }
  }

  private _showToast(msg: ChatMessage) {
    this._snackBar.open(`${msg.senderName}: ${msg.content}`, 'VIEW', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['bg-white', 'text-neutral-900', 'shadow-lg', 'border-l-4', 'border-blue-500']
    }).onAction().subscribe(() => {
      // Navigate to messenger?
      // For now, usage assumes we are in the app.
      // Router navigate could be added if needed, but 'VIEW' is just partial.
    });
  }

  private _handleConversationUpdate(payload: any) {
    const currentConvs = this._conversations$.value;
    const index = currentConvs.findIndex(c => c.id === payload.id);
    if (index !== -1) {
      const updated = {
        ...currentConvs[index],
        lastMessageAt: payload.lastMessageAt,
        lastMessagePreview: payload.lastMessagePreview
      };
      const others = currentConvs.filter(c => c.id !== payload.id);
      this._conversations$.next([updated, ...others]);
    }
  }

  private _handleConversationCreated(conv: Conversation) {
    const current = this._conversations$.value;
    if (!current.some(c => c.id === conv.id)) {
      this._conversations$.next([conv, ...current]);
    }
  }

  // --- Broadcast ---
  private _setupBroadcastListener() {
    this._broadcastChannel.onmessage = (event) => {
      // ... kept for fallback
    };
  }

  private _notifyBroadcast(type: string, payload: any) {
    this._broadcastChannel.postMessage({ type, payload });
  }

  // --- Actions ---

  private _loadConversations() {
    const user = this._authService.getUser();
    if (!user) return;
    this._api.get<Conversation[]>('/chat/conversations').pipe(
      map(convs => convs.filter(c => c.participantIds.includes(user.id))),
      map(convs => convs.sort((a, b) => {
        const timeA = new Date(a.lastMessageAt || a.createdAt).getTime();
        const timeB = new Date(b.lastMessageAt || b.createdAt).getTime();
        return timeB - timeA;
      }))
    ).subscribe(convs => {
      this._conversations$.next(convs);
    });
  }

  selectConversation(conversationId: string) {
    this._activeConversationId$.next(conversationId);
    this._reloadMessages(conversationId);
    if (this._isMessengerOpen) {
      this.markConversationAsRead(conversationId);
    }
  }

  markConversationAsRead(conversationId: string) {
    this._api.post(`/chat/conversations/${conversationId}/read`, {}).subscribe({
      next: () => {
        // Re-fetch unread count to be accurate
        this._loadUnreadCount();
      }
    });
  }

  private _reloadMessages(conversationId: string) {
    this._api.get<any[]>(`/chat/messages?conversationId=${conversationId}`)
      .pipe(
        map(msgs => msgs.map(m => ({
          ...m,
          senderName: m.sender?.name || 'Unknown',
          senderAvatar: m.sender?.avatar || ''
        } as ChatMessage)))
      )
      .subscribe(msgs => {
        this._messages$.next(msgs);
      });
  }

  sendMessage(content: string) {
    const user = this._authService.getUser();
    const conversationId = this._activeConversationId$.value;

    if (!user || !conversationId) return of(null);

    const newMessage: ChatMessage & { isTemp?: boolean } = {
      id: this._generateId(),
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
      status: 'sent',
      isTemp: true,
      readAt: undefined
    };

    // Optimistic Update
    const currentMessages = this._messages$.value;
    this._messages$.next([...currentMessages, newMessage]);

    // Update conversation locally
    this._updateLocalConversationPreview(conversationId, newMessage);

    // Persist
    return this._api.post<ChatMessage>('/chat/messages', newMessage).pipe(
      tap(() => {
        // Success
      }),
      catchError(err => {
        console.error('Failed to send message', err);
        return of(null);
      })
    );
  }

  startConversation(targetUserId: number): Observable<string> {
    const currentUser = this._authService.getUser();
    if (!currentUser) return of('');

    const existing = this._conversations$.value.find(c =>
      c.participantIds.includes(targetUserId) && c.participantIds.includes(currentUser.id)
    );

    if (existing) {
      this.selectConversation(existing.id);
      return of(existing.id);
    }

    return this._api.post<Conversation>('/chat/conversations', { recipientId: targetUserId }).pipe(
      tap(conv => {
        this._conversations$.next([conv, ...this._conversations$.value]);
        this.selectConversation(conv.id);
      }),
      map(conv => conv.id)
    );
  }

  getUsersToChat(): Observable<ChatUser[]> {
    const currentUserId = this._authService.getUser()?.id;
    return this._usersService.getAll().pipe(
      map(users => users
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: Number(u.id),
          name: u.name,
          avatar: u.avatar || '',
          status: 'offline'
        }))
      )
    );
  }

  private _updateLocalConversationPreview(conversationId: string, msg: ChatMessage) {
    const currentConvs = this._conversations$.value;
    const convIndex = currentConvs.findIndex(c => c.id === conversationId);
    if (convIndex > -1) {
      const updatedConv = {
        ...currentConvs[convIndex],
        lastMessageAt: msg.createdAt,
        lastMessagePreview: msg.content,
        lastMessageSenderId: msg.senderId,
        lastMessageStatus: msg.status
      };
      const newConvs = [updatedConv, ...currentConvs.filter(c => c.id !== conversationId)];
      this._conversations$.next(newConvs);
    }
  }

  private _generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
