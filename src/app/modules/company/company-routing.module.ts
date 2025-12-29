import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyListComponent } from './company-list/company-list.component';
import { CompanyFormComponent } from './company-form/company-form.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: CompanyListComponent,
    canActivate: [roleGuard],
    data: { permission: 'company:read' }
  },
  {
    path: 'new',
    component: CompanyFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'company:create' }
  },
  {
    path: ':id',
    component: CompanyFormComponent,
    canActivate: [roleGuard],
    data: { permission: 'company:update' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyRoutingModule { }
