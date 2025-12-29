import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { PermissionService } from '../services/permission.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const permissionService = inject(PermissionService);

  // Get required permission from route data
  const requiredPermission = route.data['permission'] as string;
  
  if (!requiredPermission) {
    return true; // No specific permission required
  }

  if (permissionService.hasPermission(requiredPermission)) {
    return true;
  }

  // Redirect to forbidden or home
  // router.navigate(['/error/403']);
  return false;
};
