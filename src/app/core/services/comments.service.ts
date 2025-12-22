import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Comment } from '../models/comment.interface';
import { TasksService } from './tasks.service';

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private _http = inject(HttpClient);
  // We inject TasksService to trigger its refresh subject (or we could expose a global refresh, 
  // but better to keep comments separate or have tasks refresh if comments count is shown on task card).
  // For now, let's keep it simple. If we need to update task metadata (like comment count), we might need to refresh tasks.
  private _tasksService = inject(TasksService);

  private apiUrl = 'http://localhost:3000/comments';

  getComments(taskId: string): Observable<Comment[]> {
    return this._http.get<Comment[]>(`${this.apiUrl}?taskId=${taskId}&_sort=createdAt&_order=asc`);
  }

  addComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    return this._http.post<Comment>(this.apiUrl, comment).pipe(
      // Trigger tasks refresh so that comment counts on cards update if we were showing them from the task object.
      // However, current task object has 'comments' array which is legacy.
      // We are moving to separate resource. The card view 'tasks.comments.length' will effectively be 0 or stale 
      // unless we also update the task object's legacy comments array or switch the card to fetch count.
      // Challenge: The current 'minhas atividades' card shows comment count. 
      // If we move to separate resource, that count is harder to get efficiently without including 'comments' embed.
      // JSON-Server supports _embed=comments, so we should update TasksService to fetch tasks with embedded comments if possible,
      // OR we just accept we need to update the legacy array for now to keep the count working easily, 
      // OR we fetch comments count separately (can be expensive for lists).
      // Best approach for Json-Server: Use `_embed=comments` when fetching tasks.
      tap(() => this._tasksService.triggerRefresh())
    );
  }
}
