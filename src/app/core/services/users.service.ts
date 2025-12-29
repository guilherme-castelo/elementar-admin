import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IUser } from '../models/user.model';
import { UserAdapter } from './user.adapter';
import { map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  getAll(): Observable<IUser[]> {
    return this.api.get<any[]>('/users').pipe(
      map(users => users.map(u => UserAdapter.toModel(u)))
    );
  }

  getById(id: string | number): Observable<IUser> {
    return this.api.get<any>(`/users/${id}`).pipe(
      map(u => UserAdapter.toModel(u))
    );
  }

  create(user: Partial<IUser>): Observable<IUser> {
    return this.api.post<any>('/users', UserAdapter.toDTO(user)).pipe(
        map(u => UserAdapter.toModel(u))
    );
  }

  update(id: string | number, user: Partial<IUser>): Observable<IUser> {
    // If partial update, we might not want to stringify undefined fields?
    // Adapter handles it cleanly?
    return this.api.put<any>(`/users/${id}`, UserAdapter.toDTO(user)).pipe(
        map(u => UserAdapter.toModel(u))
    );
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }

  inactivate(id: string | number): Observable<any> {
    return this.api.patch<any>(`/users/${id}/inactivate`, {});
  }
}
