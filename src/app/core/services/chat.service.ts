import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, combineLatest, map, switchMap, tap, of, catchError, take, merge, filter, fromEvent } from 'rxjs';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { Conversation, ChatMessage, ChatUser } from '../models/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);
  private _userService = inject(UserService);

  private readonly API_URL = 'http://localhost:3000';
  private readonly CHANNEL_NAME = 'elementar_chat_channel';
  private _broadcastChannel: BroadcastChannel;

  // State
  private _conversations$ = new BehaviorSubject<Conversation[]>([]);
  private _activeConversationId$ = new BehaviorSubject<string | null>(null);
  private _messages$ = new BehaviorSubject<ChatMessage[]>([]);

  // Public Selectors
  conversations$ = this._conversations$.asObservable();
  activeConversationId$ = this._activeConversationId$.asObservable();
  activeMessages$ = this._messages$.asObservable();

  constructor() {
    this._broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this._setupBroadcastListener();
    this._loadConversations();
  }

  // --- Broadcast Logic ---

  private _setupBroadcastListener() {
    this._broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === 'MESSAGE_SENT') {
        this._handleRemoteMessage(payload);
      }
    };
  }

  private _handleRemoteMessage(payload: { conversationId: string }) {
    // Reload messages if we are in the active conversation
    const currentActive = this._activeConversationId$.value;
    if (currentActive === payload.conversationId) {
      this._reloadMessages(currentActive);
    }
    // Always reload conversations to update lastMessage preview
    this._loadConversations();
  }

  private _notifyBroadcast(type: string, payload: any) {
    this._broadcastChannel.postMessage({ type, payload });
  }

  // --- Actions ---

  private _loadConversations() {
    const user = this._authService.getUser();
    if (!user) return;

    this._http.get<Conversation[]>(`${this.API_URL}/conversations`).pipe(
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
  }

  private _reloadMessages(conversationId: string) {
    this._http.get<ChatMessage[]>(`${this.API_URL}/messages?conversationId=${conversationId}`)
      .subscribe(msgs => {
        this._messages$.next(msgs);
      });
  }

  sendMessage(content: string) {
    const user = this._authService.getUser();
    const conversationId = this._activeConversationId$.value;

    if (!user || !conversationId) return of(null);

    const newMessage: ChatMessage = {
      id: this._generateId(),
      conversationId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      content,
      createdAt: new Date().toISOString(),
      status: 'sent'
    };

    // Optimistic Update
    const currentMessages = this._messages$.value;
    this._messages$.next([...currentMessages, newMessage]);

    // Update conversation locally
    this._updateLocalConversationPreview(conversationId, newMessage);

    // Persist
    return this._http.post<ChatMessage>(`${this.API_URL}/messages`, newMessage).pipe(
      tap(() => {
        // Sync Conversation metadata on server (fire and forget)
        this._http.patch(`${this.API_URL}/conversations/${conversationId}`, {
          lastMessageAt: newMessage.createdAt,
          lastMessagePreview: content
        }).subscribe();

        // Notify other tabs/windows
        this._notifyBroadcast('MESSAGE_SENT', { conversationId });
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

    const newConv: Conversation = {
      id: this._generateId(),
      participantIds: [currentUser.id, targetUserId],
      createdAt: new Date().toISOString()
    };

    return this._http.post<Conversation>(`${this.API_URL}/conversations`, newConv).pipe(
      tap(conv => {
        this._conversations$.next([conv, ...this._conversations$.value]);
        this.selectConversation(conv.id);
        // Maybe notify broadcast about new conversation if we want list live update
        this._notifyBroadcast('MESSAGE_SENT', { conversationId: conv.id });
      }),
      map(conv => conv.id)
    );
  }

  getUsersToChat(): Observable<ChatUser[]> {
    const currentUserId = this._authService.getUser()?.id;
    return this._userService.getUsers().pipe(
      map(users => users
        .filter(u => u.id !== currentUserId)
        .map(u => ({
          id: u.id,
          name: u.name,
          avatar: u.avatar,
          status: 'offline'
        }))
      )
    );
  }

  // Utility
  private _updateLocalConversationPreview(conversationId: string, msg: ChatMessage) {
    const currentConvs = this._conversations$.value;
    const convIndex = currentConvs.findIndex(c => c.id === conversationId);
    if (convIndex > -1) {
      const updatedConv = {
        ...currentConvs[convIndex],
        lastMessageAt: msg.createdAt,
        lastMessagePreview: msg.content
      };
      const newConvs = [updatedConv, ...currentConvs.filter(c => c.id !== conversationId)];
      this._conversations$.next(newConvs);
    }
  }

  private _generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
}
