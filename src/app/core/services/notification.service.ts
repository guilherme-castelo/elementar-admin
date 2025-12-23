import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { BehaviorSubject, Observable, tap, switchMap, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export interface AppNotification {
  id: string;
  type: 'chat' | 'task-assigned' | 'task-comment' | 'task-completed';
  title: string;
  description: string;
  entityId: string | number; // conversationId or taskId
  createdAt: string;
  read: boolean;
  archived: boolean;
  userId: number; // Recipient
  // Optional metadata if needed
  actorName?: string;
  actorAvatar?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private _api = inject(ApiService);
  private _authService = inject(AuthService);
  private readonly CHANNEL_NAME = 'elementar_notification_channel';
  private _broadcastChannel: BroadcastChannel;

  private _notifications$ = new BehaviorSubject<AppNotification[]>([]);

  // Public streams
  notifications$ = this._notifications$.asObservable();

  unreadCount$ = this.notifications$.pipe(
    map(list => list.filter(n => !n.read && !n.archived).length)
  );

  activeNotifications$ = this.notifications$.pipe(
    map(list => list.filter(n => !n.archived).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  );

  archivedNotifications$ = this.notifications$.pipe(
    map(list => list.filter(n => n.archived).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  );

  constructor() {
    this._broadcastChannel = new BroadcastChannel(this.CHANNEL_NAME);
    this._setupBroadcastListener();
    this._loadNotifications();
  }

  // --- Broadcast ---
  private _setupBroadcastListener() {
    this._broadcastChannel.onmessage = (event) => {
      const { type } = event.data;
      if (type === 'NEW_NOTIFICATION') {
        this._loadNotifications();
      }
    };
  }

  private _notifyBroadcast() {
    this._broadcastChannel.postMessage({ type: 'NEW_NOTIFICATION' });
  }

  // --- Actions ---
  private _loadNotifications() {
    const user = this._authService.getUser();
    if (!user) return;

    this._api.get<AppNotification[]>('/notifications').subscribe(list => {
      this._notifications$.next(list);
    });
  }

  createNotification(notification: Omit<AppNotification, 'id' | 'createdAt' | 'read' | 'archived'>) {
    const newNotification: AppNotification = {
      ...notification,
      id: Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
      archived: false
    };

    return this._api.post<AppNotification>('/notifications', newNotification).pipe(
      tap(() => {
        // If sending to SELF (e.g. testing), reload. If to OTHER, broadcast.
        // Broadcast is always good to update OTHER active tabs of SAME user as well (if logged in multiple places).
        // WARNING: BroadcastChannel is browser-local (same machine). 
        // Real-time across network needs polling or socket.
        // For this task, we rely on broadcast for local simulation + polling fallback or manual reload for remote.
        // BUT, if I am the SENDER, I don't need to load it. The RECIEVER needs it.
        // If I create a notif for User B, User B needs to know.
        // On local machine (same browser), User B tab will hear broadcast.
        this._notifyBroadcast();
      })
    );
  }

  markAsRead(id: string) {
    const current = this._notifications$.value;
    const index = current.findIndex(n => n.id === id);
    if (index > -1) {
      const updated = { ...current[index], read: true };
      const newList = [...current];
      newList[index] = updated;
      this._notifications$.next(newList);

      this._api.patch(`/notifications/${id}/read`, {}).subscribe();
    }
  }

  archive(id: string) {
    const current = this._notifications$.value;
    const index = current.findIndex(n => n.id === id);
    if (index > -1) {
      const updated = { ...current[index], archived: true };
      const newList = [...current];
      newList[index] = updated;
      this._notifications$.next(newList);

      this._api.patch(`/notifications/${id}/archive`, {}).subscribe();
    }
  }

  markAllAsRead() {
    const user = this._authService.getUser();
    if (!user) return;

    // Optimistic
    const current = this._notifications$.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this._notifications$.next(updated);

    // Batch update is hard with json-server, iterate?
    // For now, MVP: likely individual calls or just leave it for single mark.
    // Let's implement single mark on list.
    // If "Mark All Read" is needed:
    current.filter(n => !n.read).forEach(n => {
      this._api.patch(`/notifications/${n.id}`, { read: true }).subscribe();
    });
  }
}
