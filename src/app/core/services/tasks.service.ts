import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, BehaviorSubject, tap, switchMap, take } from 'rxjs';
import { Task, TaskComment } from '../models/task.interface';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private _http = inject(HttpClient);
  private _authService = inject(AuthService);
  private _notificationService = inject(NotificationService);
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

  getTaskById(id: string | number): Observable<Task> {
    return this._http.get<Task>(`${this.apiUrl}/${id}`);
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
    // Read before write to detect changes for notifications
    return this.getTaskById(task.id).pipe(
      take(1),
      switchMap(oldTask => {
        this._checkForNotifications(oldTask, task);
        return this._http.put<Task>(`${this.apiUrl}/${task.id}`, task);
      }),
      tap(() => this._refresh$.next())
    );
  }

  deleteTask(id: string): Observable<void> {
    return this._http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this._refresh$.next())
    );
  }

  private _checkForNotifications(oldTask: Task, newTask: Task) {
    const currentUser = this._authService.getUser();
    if (!currentUser) return;

    // 1. Check for newly assigned collaborators
    const newCollaborators = newTask.collaboratorUserIds.filter(id => !oldTask.collaboratorUserIds.includes(id));
    newCollaborators.forEach(userId => {
      if (userId !== currentUser.id) { // Don't notify self
        this._notificationService.createNotification({
          type: 'task-assigned',
          title: 'New Task Assignment',
          description: `You were assigned to task: ${newTask.title}`,
          entityId: newTask.id,
          userId: Number(userId),
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar
        }).subscribe();
      }
    });

    // 2. Check for completion
    if (oldTask.status !== 'done' && newTask.status === 'done') {
      // Notify owner and collaborators (except self)
      const recipients = new Set([...newTask.collaboratorUserIds, newTask.ownerUserId]);
      recipients.delete(currentUser.id);

      recipients.forEach(userId => {
        this._notificationService.createNotification({
          type: 'task-completed',
          title: 'Task Completed',
          description: `${currentUser.name} completed task: ${newTask.title}`,
          entityId: newTask.id,
          userId: Number(userId),
          actorName: currentUser.name,
          actorAvatar: currentUser.avatar
        }).subscribe();
      });
    }
  }
}
