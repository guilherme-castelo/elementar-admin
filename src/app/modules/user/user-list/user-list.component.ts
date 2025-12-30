import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../core/services/permission.service';
import { UsersService } from '../../../core/services/users.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Gerenciamento de Usuários</h1>
        <a *ngIf="permissionService.hasPermission('user:create')" mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon> Novo Usuário
        </a>
      </div>

      <div class="mat-elevation-z2 rounded-lg overflow-hidden bg-white">
        <table mat-table [dataSource]="(users$ | async) || []" class="w-full">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef> ID </th>
            <td mat-cell *matCellDef="let user"> {{user.id}} </td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nome </th>
            <td mat-cell *matCellDef="let user"> 
              <div class="font-medium">{{user.name}}</div>
              <div class="text-xs text-gray-500">{{user.email}}</div>
            </td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef> Função </th>
            <td mat-cell *matCellDef="let user" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"> 
                {{ user.roles }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Ações </th>
            <td mat-cell *matCellDef="let user">
              <button mat-icon-button color="accent" [routerLink]="[user.id]">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    table { width: 100%; }
  `]
})
export class UserListComponent implements OnInit {
  private usersService = inject(UsersService);
  public permissionService = inject(PermissionService);
  users$!: Observable<any[]>;
  displayedColumns: string[] = ['id', 'name', 'role', 'actions'];

  ngOnInit() {
    this.users$ = this.usersService.getAll();
  }
}
