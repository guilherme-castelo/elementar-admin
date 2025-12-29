import { Directive, Input, TemplateRef, ViewContainerRef, inject } from '@angular/core';
import { PermissionService } from '../services/permission.service';

@Directive({
  standalone: true,
  selector: '[appHasPermission]'
})
export class HasPermissionDirective {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  @Input() set appHasPermission(permissions: string | string[]) {
    const perms = Array.isArray(permissions) ? permissions : [permissions];
    
    // Check if user has ANY of the required permissions (OR logic)
    // If we wanted AND logic, we'd use every().
    const hasPermission = this.permissionService.hasAny(perms);

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
