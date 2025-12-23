import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, tap, switchMap, take } from 'rxjs';
import { Comment } from '../models/comment.interface';
import { TasksService } from './tasks.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private _api = inject(ApiService);
  private _tasksService = inject(TasksService);
  private _notificationService = inject(NotificationService);
  private _authService = inject(AuthService);

  getComments(taskId: string): Observable<Comment[]> {
    return this._api.get<Comment[]>(`/tasks/${taskId}/comments`);
  }

  addComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    return this._api.post<Comment>(`/tasks/${comment.taskId}/comments`, comment).pipe(
      tap(() => {
        this._tasksService.triggerRefresh();
        this._notifyTaskParticipants(comment);
      })
    );
  }

  private _notifyTaskParticipants(comment: Omit<Comment, 'id'>) {
    const currentUser = this._authService.getUser();
    if (!currentUser) return;

    this._tasksService.getTaskById(comment.taskId).pipe(take(1)).subscribe(task => {
      const recipients = new Set([...task.collaboratorUserIds, task.ownerUserId]);
      recipients.delete(currentUser.id);

      recipients.forEach(userId => {
        this._notificationService.createNotification({
          type: 'task-comment',
          title: 'New Comment',
          description: `${currentUser.name} commented on: ${task.title}`,
          entityId: task.id,
          userId: Number(userId),
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar
        }).subscribe();
      });
    });
  }
}
