import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
    canActivate: [roleGuard],
    data: { permission: 'employee:read' }
  },
  {
    path: 'new',
    component: EmployeeFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'employee:create' }
  },
  {
    path: ':id/edit',
    component: EmployeeFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'employee:update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeesRoutingModule { }
