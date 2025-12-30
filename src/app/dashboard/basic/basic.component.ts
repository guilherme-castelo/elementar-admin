import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DashboardService } from '../dashboard.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { TasksInProgressWidgetComponent } from '../../_store/widgets/tasks-in-progress-widget/tasks-in-progress-widget.component';
import { TodosWidgetComponent } from '../../_store/widgets/todos-widget/todos-widget.component';
import { ReportPeriodService } from '../../core/services/report-period.service';

@Component({
  selector: 'app-dashboard-basic',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    RouterLink,
    TasksInProgressWidgetComponent,
    TodosWidgetComponent,
  ],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.scss',
})
export class BasicComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);
  private reportPeriodService = inject(ReportPeriodService);

  stats: any = null;
  isLoading = true;
  currentUser: any = null;

  // Meal Filter State
  mealStats = { qty: 0, value: 0 };
  mealFilterType: 'day' | 'week' | 'prev_week' | 'month' | 'prev_month' = 'day';
  mealFilterLabel = 'Hoje';
  isMealLoading = false;

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.isLoading = true;
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data;
        // Initialize meal stats with "Today"
        this.mealStats = {
          qty: data.todayMealsQty,
          value: data.todayMealsQty * 3.0,
        }; // Fallback calc if not provided
        this.setMealFilter('day'); // Ensure valid state
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.isLoading = false;
      },
    });
  }

  setMealFilter(type: 'day' | 'week' | 'prev_week' | 'month' | 'prev_month') {
    this.mealFilterType = type;
    this.isMealLoading = true;

    let start: Date, end: Date;
    const today = new Date();

    switch (type) {
      case 'day':
        this.mealFilterLabel = 'Hoje';
        start = new Date(today);
        end = new Date(today);
        // Stats are already in main payload usually, but let's re-fetch to be consistent or use cached if 'day' is special
        // Actually, let's fetch always to simplify logic, or use cached todayMealsQty
        // Using cached for 'day' to avoid extra req if possible, but calculating value might need fetch if we don't have it for day?
        // DashboardService.getDashboardData returns todayMealsQty. Let's assume standard price or fetch.
        // Let's fetch for consistency.
        break;

      case 'week':
        this.mealFilterLabel = 'Esta Semana';
        // Current week (Mon-Sun)
        start = new Date(today);
        const day = start.getDay() || 7; // Get current day number, converting Sun. 0 to 7
        if (day !== 1) start.setHours(-24 * (day - 1)); // Set to Monday
        end = new Date(start);
        end.setDate(end.getDate() + 6); // Set to Sunday
        break;

      case 'prev_week':
        this.mealFilterLabel = 'Semana Anterior';
        start = new Date(today);
        const pDay = start.getDay() || 7;
        start.setDate(start.getDate() - pDay - 6); // Last Monday
        end = new Date(start);
        end.setDate(end.getDate() + 6); // Last Sunday
        break;

      case 'month':
        // Current Billing Month
        this.mealFilterLabel = 'Mês Atual';
        const currPeriod =
          this.reportPeriodService.getCurrentBillingMonthYear();
        const p1 = this.reportPeriodService.getPeriodByMonth(
          currPeriod.month,
          currPeriod.year
        );
        start = p1.start;
        end = p1.end;
        break;

      case 'prev_month':
        this.mealFilterLabel = 'Mês Anterior';
        let pm = new Date().getMonth() - 1;
        let py = new Date().getFullYear();
        if (pm < 0) {
          pm = 11;
          py--;
        }

        // Logic: if Current Billing Period is Jan (Dec 26 - Jan 25), Prev is Dec (Nov 26 - Dec 25).
        // getCurrentBillingMonthYear gives the period of TODAY.
        // We want (Current - 1).
        const cBm = this.reportPeriodService.getCurrentBillingMonthYear();
        let targetM = cBm.month - 1;
        let targetY = cBm.year;
        if (targetM < 0) {
          targetM = 11;
          targetY--;
        }

        const p2 = this.reportPeriodService.getPeriodByMonth(targetM, targetY);
        start = p2.start;
        end = p2.end;
        break;
    }

    const startIso = start.toISOString().split('T')[0];
    const endIso = end.toISOString().split('T')[0];

    this.dashboardService.getMealStats(startIso, endIso).subscribe({
      next: (res) => {
        this.mealStats = res;
        this.isMealLoading = false;
      },
      error: () => (this.isMealLoading = false),
    });
  }

  get canViewMeals(): boolean {
    return this.permissionService.hasPermission('meal:read');
  }

  get canViewEmployees(): boolean {
    return this.permissionService.hasPermission('employee:read');
  }

  get canViewIntegrations(): boolean {
    return this.permissionService.hasPermission('integration:dominio');
  }

  get isIntegrationConfigured(): boolean {
    const config = this.stats?.integration;
    return config && config.dominioCode;
  }

  get myTasksList(): any[] {
    if (!this.stats?.myTasks || !this.currentUser) return [];
    return this.stats.myTasks
      .filter(
        (t: any) =>
          t.ownerUserId === this.currentUser.id ||
          t.collaboratorUserIds?.includes(this.currentUser.id)
      )
      .slice(0, 5);
  }

  get publicTasksList(): any[] {
    if (!this.stats?.myTasks) return [];
    return this.stats.myTasks.filter((t: any) => t.isPublic).slice(0, 5);
  }

  get recentMessages(): any[] {
    return this.stats?.recentChats || [];
  }

  getChatName(conv: any): string {
    if (!this.stats?.systemUsers || !this.currentUser) return 'Chat';
    const otherId = conv.participantIds?.find(
      (id: number) => id !== this.currentUser.id
    );
    if (!otherId) return 'Chat';
    const user = this.stats.systemUsers.find((u: any) => u.id === otherId);
    return user ? user.name : 'Unknown';
  }
}
