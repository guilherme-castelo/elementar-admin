import { Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MealRegisterComponent } from './meal-register/meal-register.component';
import { MealReportsComponent } from './meal-reports/meal-reports.component';
import { PermissionService } from '../../core/services/permission.service';

@Component({
  selector: 'app-meal',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTabsModule,
    MealRegisterComponent,
    MealReportsComponent,
  ],
  templateUrl: './meal.component.html',
})
export class MealComponent {
  private permissionService = inject(PermissionService);
  selected = new FormControl(0);

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
