import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MealRegisterComponent } from './meal-register/meal-register.component';
import { MealReportsComponent } from './meal-reports/meal-reports.component';
import { roleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: 'register',
    component: MealRegisterComponent,
    canActivate: [roleGuard],
    data: { permission: 'meals:register' }
  },
  {
    path: 'reports',
    component: MealReportsComponent,
    canActivate: [roleGuard],
    data: { permission: 'meals:reports' }
  },
  {
    path: '', // Default redirect or landing?
    redirectTo: 'register',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MealsRoutingModule { }
