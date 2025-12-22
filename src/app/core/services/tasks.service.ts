import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, tap, switchMap } from 'rxjs';
import { Task, TaskComment } from '../models/task.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/tasks';

  private _refresh$ = new BehaviorSubject<void>(undefined);

  get refresh$() {
    return this._refresh$.asObservable();
  }

  triggerRefresh() {
    this._refresh$.next();
  }

  getTasks(params?: any): Observable<Task[]> {
    return this._refresh$.pipe(
      switchMap(() => this._http.get<Task[]>(this.apiUrl, {
        params: { ...params, _embed: 'comments' }
      }))
    );
  }

  getPublicTasks(): Observable<Task[]> {
    return this.getTasks().pipe(
      map(tasks => tasks.filter(task => task.isPublic))
    );
  }

  getMyTasksPaginated(page: number = 1, limit: number = 3): Observable<{ data: Task[], total: number }> {
    const user = this._authService.getUser();
    if (!user) {
      return this._refresh$.pipe(
        switchMap(() => new Observable<{ data: Task[], total: number }>(observer => observer.next({ data: [], total: 0 })))
      );
    }
    const userId = user.id;

    // Client-side filtering then pagination, as discussed
    return this.getTasks().pipe(
      map(tasks => {
        const filtered = tasks.filter(task =>
          task.ownerUserId === userId ||
          task.collaboratorUserIds.includes(userId)
        );
        const total = filtered.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        const data = filtered.slice(start, end);
        return { data, total };
      })
    );
  }

  getMyTasks(): Observable<Task[]> {
    const user = this._authService.getUser();
    if (!user) {
      return this._refresh$.pipe(
        switchMap(() => new Observable<Task[]>(observer => observer.next([])))
      );
    }
    const userId = user.id;

    return this.getTasks().pipe(
      map(tasks => tasks.filter(task =>
        task.ownerUserId === userId ||
        task.collaboratorUserIds.includes(userId)
      ))
    );
  }

  createTask(task: Omit<Task, 'id'>): Observable<Task> {
    return this._http.post<Task>(this.apiUrl, task).pipe(
      tap(() => this._refresh$.next())
    );
  }

  updateTask(task: Task): Observable<Task> {
    return this._http.put<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
      tap(() => this._refresh$.next())
    );
  }

  deleteTask(id: string): Observable<void> {
    return this._http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this._refresh$.next())
    );
  }

  // Legacy support for 'comments' array in Task (if needed), 
  // but we should prefer separate service. 
  // However, `tasks-in-progress` card reads `task.comments.length`. 
  // Since we use `_embed=comments` in getTasks, that property will be populated by json-server dynamically 
  // even if the array in db.json 'tasks' is empty, IF the relationship is set up correctly (resource name matching).
  // Resource is 'comments', and it has 'taskId'. Json-server automatically embeds children.
  // BUT the property name will be 'comments' (plural) matching the resource name.
  // So `task.comments` will work for reading.
  // For adding, we use CommentsService.
  // For the legacy `addComment` method here, we can deprecate or redirect to CommentsService.
  // Let's redirect it or remove it? The instruction says "Refactor TasksService".
  // Keeping it for backward compatibility but making it use the new system logic if possible, 
  // OR just assume new code won't use it.
  // I'll leave the old one but implementing new logic might be complex. 
  // Let's just keep the old implementation as legacy fallback OR remove it if unused.
  // Actually, let's keep it but mark deprecated or just rely on CommentsService.
  // I'll simply remove `addComment` from here to force usage of `CommentsService`.
}
