import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, switchMap, take } from 'rxjs';
import { Comment } from '../models/comment.interface';
import { TasksService } from './tasks.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private _http = inject(HttpClient);
  private _tasksService = inject(TasksService);
  private _notificationService = inject(NotificationService);
  private _authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/comments';

  getComments(taskId: string): Observable<Comment[]> {
    return this._http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}&_sort=createdAt&_order=asc`);
  }

  addComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    return this._http.post<Comment>(this.apiUrl, comment).pipe(
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
