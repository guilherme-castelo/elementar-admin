import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserFormComponent } from './user-form/user-form.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: UserListComponent,
    canActivate: [roleGuard],
    data: { permission: 'users:read' }
  },
  {
    path: 'new',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'users:create' }
  },
  {
    path: ':id',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'users:update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
