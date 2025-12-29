import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { IPermission } from '../models/permission.model';
import { IUser } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private api = inject(ApiService);
  
  // State for RBAC (Loaded on Login)
  private _permissions = new BehaviorSubject<string[]>([]);
  public permissions$ = this._permissions.asObservable();

  constructor() {
    this.loadFromStorage();
  }

  // --- Management API (Admin) ---
  getAll(): Observable<IPermission[]> {
    return this.api.get<IPermission[]>('/permissions');
  }

  getById(id: number): Observable<IPermission> {
    return this.api.get<IPermission>(`/permissions/${id}`);
  }
  
  // Note: Create/Update/Delete typically not exposed easily or are strict seeds, 
  // but if Admin needs to create Feature Flags dynamically:
  create(permission: Partial<IPermission>): Observable<IPermission> {
    return this.api.post<IPermission>('/permissions', permission);
  }

  // --- RBAC Checks (Client) ---

  loadFromStorage() {
    const stored = localStorage.getItem('auth_permissions');
    if (stored) {
      try {
        this._permissions.next(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse permissions', e);
      }
    }
  }

  loadPermissions(user: IUser) {
    // If backend provides flattened permissions in 'user.role.permissions' (array of objects)
    // We map to slugs.
    // However, AuthService login response usually returns a separate 'permissions' array of strings.
    // If we use that, we just call setPermissions.
  }

  setPermissions(slugs: string[]) {
    this._permissions.next(slugs);
    localStorage.setItem('auth_permissions', JSON.stringify(slugs));
  }

  /**
   * Checks if user has specific permission slug.
   */
  hasPermission(permission: string): boolean {
    return this._permissions.value.includes(permission);
  }

  /**
   * Checks if user has ANY of the provided permissions.
   */
  hasAny(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  // Deprecated: Role checks should be avoided in favor of Permissions.
  // But keeping for legacy support if needed.
  hasRole(roleName: string): boolean {
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    // New User Model: user.role (object) or user.role.name
    if (user.role && typeof user.role === 'object') {
        return user.role.name === roleName;
    }
    // Old/Fallback
    return user.roles && user.roles.includes(roleName);
  }
}
