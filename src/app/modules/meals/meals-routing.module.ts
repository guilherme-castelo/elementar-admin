import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MealRegisterComponent } from './meal-register/meal-register.component';
import { MealReportsComponent } from './meal-reports/meal-reports.component';
import { roleGuard } from '../../core/guards/role.guard';
import { MealComponent } from './meal.component';

const routes: Routes = [
  {
    path: 'register',
    component: MealRegisterComponent,
    canActivate: [roleGuard],
    data: { permission: 'meal:create' }
  },
  {
    path: 'reports',
    component: MealReportsComponent,
    canActivate: [roleGuard],
    data: { permission: 'meal:read' }
  },
  {
    path: '',
    component: MealComponent,
    canActivate: [roleGuard],
    data: { permission: 'meal:read' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MealsRoutingModule { }
