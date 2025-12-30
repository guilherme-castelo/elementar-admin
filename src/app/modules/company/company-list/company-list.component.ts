import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { CompanyService } from '../../../core/services/company.service';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-company-list',
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
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Gerenciamento de Empresas</h1>
        <a *ngIf="permissionService.hasPermission('company:create')" mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon> Nova Empresa
        </a>
      </div>

      <div class="mat-elevation-z2 rounded-lg overflow-hidden bg-white dark:bg-neutral-800">
        <table mat-table [dataSource]="(companies$ | async) || []" class="w-full">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef class="dark:bg-neutral-800 dark:text-neutral-200"> ID </th>
            <td mat-cell *matCellDef="let company" class="dark:text-neutral-300"> {{company.id}} </td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef class="dark:bg-neutral-800 dark:text-neutral-200"> Nome </th>
            <td mat-cell *matCellDef="let company" class="dark:text-neutral-300"> 
              <div class="font-medium">{{company.name}}</div>
            </td>
          </ng-container>

          <!-- CNPJ Column -->
          <ng-container matColumnDef="cnpj">
            <th mat-header-cell *matHeaderCellDef class="dark:bg-neutral-800 dark:text-neutral-200"> CNPJ </th>
            <td mat-cell *matCellDef="let company" class="dark:text-neutral-300"> {{company.cnpj}} </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="dark:bg-neutral-800 dark:text-neutral-200"> Ações </th>
            <td mat-cell *matCellDef="let company" class="dark:text-neutral-300">
              <button *ngIf="permissionService.hasPermission('company:update')" mat-icon-button color="accent" [routerLink]="[company.id]">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `
})
export class CompanyListComponent implements OnInit {
  public permissionService = inject(PermissionService);
  private companyService = inject(CompanyService);

  companies$!: Observable<any[]>;
  displayedColumns: string[] = ['id', 'name', 'cnpj', 'actions'];

  ngOnInit() {
    this.companies$ = this.companyService.getCompanies();
  }
}
