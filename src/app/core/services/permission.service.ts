import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  constructor() { }

  hasPermission(permission: string): boolean {
    const permissions = JSON.parse(localStorage.getItem('auth_permissions') || '[]');
    return permissions.includes(permission);
  }

  hasRole(role: string): boolean {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    return user.roles && user.roles.includes(role);
  }
}
