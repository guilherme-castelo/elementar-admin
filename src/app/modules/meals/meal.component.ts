import { Component, inject, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MealRegisterComponent } from './meal-register/meal-register.component';
import { MealReportsComponent } from './meal-reports/meal-reports.component';
import { PermissionService } from '../../core/services/permission.service';
import { ActivatedRoute } from '@angular/router';

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
export class MealComponent implements OnInit {
  private permissionService = inject(PermissionService);
  private route = inject(ActivatedRoute);
  selected = new FormControl(0);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'];
      if (tab === 'reports') {
        const index = this.hasPermission('meal:create') ? 1 : 0;
        this.selected.setValue(index);
      } else if (tab === 'register') {
        this.selected.setValue(0);
      }
    });
  }

  hasPermission(permission: string): boolean {
    return this.permissionService.hasPermission(permission);
  }
}
