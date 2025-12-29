import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { IRole } from '../models/role.model';

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private api = inject(ApiService);

  getAll(): Observable<IRole[]> {
    return this.api.get<IRole[]>('/roles');
  }

  getById(id: number): Observable<IRole> {
    return this.api.get<IRole>(`/roles/${id}`);
  }

  create(role: Partial<IRole>): Observable<IRole> {
    return this.api.post<IRole>('/roles', role);
  }

  update(id: number, role: Partial<IRole>): Observable<IRole> {
    return this.api.put<IRole>(`/roles/${id}`, role);
  }

  delete(id: number): Observable<void> {
    return this.api.delete<void>(`/roles/${id}`);
  }
}
