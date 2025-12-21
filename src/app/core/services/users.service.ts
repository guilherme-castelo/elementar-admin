import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { IUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private api = inject(ApiService);

  getAll(): Observable<IUser[]> {
    return this.api.get<IUser[]>('/users');
  }

  getById(id: string | number): Observable<IUser> {
    return this.api.get<IUser>(`/users/${id}`);
  }

  create(user: Omit<IUser, 'id'>): Observable<IUser> {
    return this.api.post<IUser>('/users', user);
  }

  update(id: string | number, user: Partial<IUser>): Observable<IUser> {
    return this.api.put<IUser>(`/users/${id}`, user);
  }

  delete(id: string | number): Observable<void> {
    return this.api.delete<void>(`/users/${id}`);
  }
}
