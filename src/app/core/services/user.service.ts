import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  roles?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private _api = inject(ApiService);

  getUsers(): Observable<User[]> {
    return this._api.get<User[]>('/users');
  }
}
