import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RoleListComponent } from './role-list/role-list.component';
import { RoleFormComponent } from './role-form/role-form.component';
import { permissionGuard } from '../../core/guards/permission.guard';

const routes: Routes = [
  {
    path: '',
    component: RoleListComponent,
    canActivate: [permissionGuard],
    data: { permission: 'role:manage' }
  },
  {
    path: 'new',
    component: RoleFormComponent,
    canActivate: [permissionGuard],
    data: { permission: 'role:manage' }
  },
  {
    path: ':id/edit',
    component: RoleFormComponent,
    canActivate: [permissionGuard],
    data: { permission: 'role:manage' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RolesRoutingModule { }
