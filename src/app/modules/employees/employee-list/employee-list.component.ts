import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { EmployeesService } from '../../../core/services/employees.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IEmployee } from '../../../core/models/employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    RouterLink
  ],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">Funcionários</h1>
          <p class="text-neutral-500">Gerencie o quadro de colaboradores da empresa</p>
        </div>
        <a *ngIf="permissionService.hasPermission('employees:create')" mat-flat-button color="primary" routerLink="new">
          <mat-icon>add</mat-icon> Novo Funcionário
        </a>
      </div>

      <div class="mat-elevation-z2 rounded-lg overflow-hidden bg-white">
        <table mat-table [dataSource]="(employees$ | async) || []" class="w-full">
          
          <!-- Matricula -->
          <ng-container matColumnDef="matricula">
            <th mat-header-cell *matHeaderCellDef> Matrícula </th>
            <td mat-cell *matCellDef="let employee"> {{employee.matricula}} </td>
          </ng-container>

          <!-- Nome -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Nome </th>
            <td mat-cell *matCellDef="let employee"> 
              <div class="font-medium">{{employee.firstName}} {{employee.lastName}}</div>
              <div class="text-xs text-neutral-400">CPF: {{employee.cpf}}</div>
            </td>
          </ng-container>

          <!-- Função/Setor -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef> Cargo / Setor </th>
            <td mat-cell *matCellDef="let employee">
              <div>{{employee.funcao}}</div>
              <div class="text-xs text-neutral-400">{{employee.setor}}</div>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef> Status </th>
            <td mat-cell *matCellDef="let employee">
              <span class="px-2 py-1 rounded text-xs font-semibold"
                [ngClass]="employee.dataDemissao ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'">
                {{ employee.dataDemissao ? 'Demitido' : 'Ativo' }}
              </span>
            </td>
          </ng-container>

          <!-- Ações -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Ações </th>
            <td mat-cell *matCellDef="let employee">
              <button *ngIf="permissionService.hasPermission('employees:update')" mat-icon-button color="primary" [routerLink]="[employee.id, 'edit']">
                <mat-icon>edit</mat-icon>
              </button>
              <button *ngIf="permissionService.hasPermission('employees:delete')" mat-icon-button color="warn" (click)="deleteEmployee(employee.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell text-center py-6 text-neutral-500" [attr.colspan]="displayedColumns.length">
              Nenhum funcionário encontrado.
            </td>
          </tr>
        </table>
      </div>
    </div>
  `
})
export class EmployeeListComponent implements OnInit {
  public permissionService = inject(PermissionService);
  private employeesService = inject(EmployeesService);
  private snackBar = inject(MatSnackBar);

  employees$!: Observable<IEmployee[]>;
  displayedColumns: string[] = ['matricula', 'name', 'role', 'status', 'actions'];

  ngOnInit() {
    this.initialLoad();
  }

  initialLoad() {
    this.employees$ = this.employeesService.getAll();
  }

  deleteEmployee(id: string) {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      this.employeesService.delete(id).subscribe({
        next: () => {
          this.snackBar.open('Funcionário excluído com sucesso', 'OK', { duration: 3000 });
          this.initialLoad();
        },
        error: () => this.snackBar.open('Erro ao excluir funcionário', 'OK', { duration: 3000 })
      });
    }
  }
}
