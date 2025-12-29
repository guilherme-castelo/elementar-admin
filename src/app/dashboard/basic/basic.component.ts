import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../dashboard.service';
import { PermissionService } from '../../core/services/permission.service';
import { AuthService } from '../../core/services/auth.service';
import { RouterLink } from '@angular/router';
import { TasksInProgressWidgetComponent } from '../../_store/widgets/tasks-in-progress-widget/tasks-in-progress-widget.component';
import { TodosWidgetComponent } from '../../_store/widgets/todos-widget/todos-widget.component';

@Component({
  selector: 'app-dashboard-basic',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    TasksInProgressWidgetComponent,
    TodosWidgetComponent
  ],
  templateUrl: './basic.component.html',
  styleUrl: './basic.component.scss'
})
export class BasicComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private permissionService = inject(PermissionService);
  private authService = inject(AuthService);

  stats: any = null;
  isLoading = true;
  currentUser: any = null;

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load dashboard stats', err);
        this.isLoading = false;
      }
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
        .filter((t: any) => t.ownerUserId === this.currentUser.id || t.collaboratorUserIds?.includes(this.currentUser.id))
        .slice(0, 5);
  }

  get publicTasksList(): any[] {
     if (!this.stats?.myTasks) return [];
     return this.stats.myTasks
        .filter((t: any) => t.isPublic)
        .slice(0, 5);
  }

  get recentMessages(): any[] {
     return this.stats?.recentChats || [];
  }

  getChatName(conv: any): string {
    if (!this.stats?.systemUsers || !this.currentUser) return 'Chat';
    const otherId = conv.participantIds?.find((id: number) => id !== this.currentUser.id);
    if (!otherId) return 'Chat';
    const user = this.stats.systemUsers.find((u: any) => u.id === otherId);
    return user ? user.name : 'Unknown';
  }
}
