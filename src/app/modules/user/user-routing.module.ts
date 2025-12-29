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
    data: { permission: 'user:read' }
  },
  {
    path: 'new',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'user:create' }
  },
  {
    path: ':id',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'user:update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserRoutingModule { }
