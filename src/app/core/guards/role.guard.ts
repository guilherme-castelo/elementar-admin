import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from '../services/permission.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard: CanActivateFn = (route, state) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const requiredPermission = route.data['permission'];
  const requiredRole = route.data['role'];

  if (requiredPermission && !permissionService.hasPermission(requiredPermission)) {
    snackBar.open('Você não tem permissão para acessar esta página.', 'OK', { duration: 3000 });
    return false;
  }

  if (requiredRole && !permissionService.hasRole(requiredRole)) {
    snackBar.open('Você não tem permissão para acessar esta página.', 'OK', { duration: 3000 });
    return false;
  }

  return true;
};
