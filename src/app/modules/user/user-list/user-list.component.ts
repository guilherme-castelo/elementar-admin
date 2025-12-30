import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatPaginatorModule,
  MatPaginator,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../core/services/permission.service';
import { UsersService } from '../../../core/services/users.service';
import { getPtBrPaginatorIntl } from '../../../shared/helpers/paginator-intl';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: getPtBrPaginatorIntl() }],
  template: `
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Gerenciamento de Usuários
        </h1>
        <div class="flex gap-2">
          <button
            mat-icon-button
            (click)="showFilters = !showFilters"
            [color]="showFilters ? 'primary' : ''"
            matTooltip="Filtrar"
          >
            <mat-icon>filter_list</mat-icon>
          </button>
          <a
            *ngIf="permissionService.hasPermission('user:create')"
            mat-flat-button
            color="primary"
            routerLink="new"
          >
            <mat-icon>add</mat-icon> Novo Usuário
          </a>
        </div>
      </div>

      <div
        class="mat-elevation-z2 rounded-lg overflow-hidden bg-white dark:bg-neutral-800"
      >
        <!-- Filters Header -->
        <div
          *ngIf="showFilters"
          class="p-4 bg-gray-50 dark:bg-neutral-900 border-b dark:border-neutral-700 flex gap-4 overflow-x-auto"
          [formGroup]="filterForm"
        >
          <mat-form-field
            appearance="outline"
            class="w-24 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>ID</mat-label>
            <input matInput formControlName="id" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="flex-1 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Nome / Email</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="w-48 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Função</mat-label>
            <input matInput formControlName="role" />
          </mat-form-field>

          <button
            mat-icon-button
            (click)="clearFilters()"
            matTooltip="Limpar filtros"
          >
            <mat-icon>filter_alt_off</mat-icon>
          </button>
        </div>

        <table mat-table [dataSource]="dataSource" class="w-full">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              ID
            </th>
            <td mat-cell *matCellDef="let user" class="dark:text-neutral-300">
              {{ user.id }}
            </td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              Nome
            </th>
            <td mat-cell *matCellDef="let user" class="dark:text-neutral-300">
              <div class="font-medium">{{ user.name }}</div>
              <div class="text-xs text-gray-500 dark:text-neutral-400">
                {{ user.email }}
              </div>
            </td>
          </ng-container>

          <!-- Role Column -->
          <ng-container matColumnDef="role">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              Função
            </th>
            <td
              mat-cell
              *matCellDef="let user"
              class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-neutral-400"
            >
              {{ user.roles }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th
              mat-header-cell
              *matHeaderCellDef
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              Ações
            </th>
            <td mat-cell *matCellDef="let user" class="dark:text-neutral-300">
              <button mat-icon-button color="accent" [routerLink]="[user.id]">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td
              class="mat-cell text-center py-6 text-neutral-500 dark:text-neutral-400"
              [attr.colspan]="displayedColumns.length"
            >
              Nenhum usuário encontrado com os filtros atuais.
            </td>
          </tr>
        </table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          aria-label="Selecione a página de usuários"
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      table {
        width: 100%;
      }
      .dense-form-field .mat-mdc-form-field-wrapper {
        padding-bottom: 0;
      }
    `,
  ],
})
export class UserListComponent implements OnInit, AfterViewInit {
  private usersService = inject(UsersService);
  public permissionService = inject(PermissionService);

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'name', 'role', 'actions'];
  showFilters = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filterForm = new FormGroup({
    id: new FormControl(''),
    name: new FormControl(''),
    role: new FormControl(''),
  });

  ngOnInit() {
    this.setupFilterPredicate();
    this.initialLoad();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  initialLoad() {
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => console.error('Erro ao carregar usuários'),
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);

      const matchId = !filters.id || data.id.toString().includes(filters.id);
      const nameEmail = (data.name + ' ' + data.email).toLowerCase();
      const matchName = !filters.name || nameEmail.includes(filters.name);

      const matchRole =
        !filters.role ||
        (data.roles && data.roles.toLowerCase().includes(filters.role));

      return matchId && matchName && matchRole;
    };
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const filterString = JSON.stringify({
      id: filters.id || '',
      name: filters.name?.toLowerCase() || '',
      role: filters.role?.toLowerCase() || '',
    });
    this.dataSource.filter = filterString;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }
}
