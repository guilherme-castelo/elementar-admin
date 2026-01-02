import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import {
  MatPaginatorModule,
  MatPaginator,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmployeesService } from '../../../core/services/employees.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IEmployee } from '../../../core/models/employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeImportDialogComponent } from '../employee-import-dialog/employee-import-dialog.component';
import { getPtBrPaginatorIntl } from '../../../shared/helpers/paginator-intl';
import { DismissalMealsDialogComponent } from '../dismissal-meals-dialog/dismissal-meals-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { switchMap, of, filter } from 'rxjs';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
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
        <div>
          <h1 class="text-2xl font-bold">Funcionários</h1>
          <p class="text-neutral-500">
            Gerencie o quadro de colaboradores da empresa
          </p>
        </div>
        <div class="flex gap-2">
          <button
            mat-icon-button
            (click)="showFilters = !showFilters"
            [color]="showFilters ? 'primary' : ''"
            matTooltip="Filtrar"
          >
            <mat-icon>filter_list</mat-icon>
          </button>
          <button
            *ngIf="permissionService.hasPermission('employee:create')"
            mat-stroked-button
            color="primary"
            (click)="openImportDialog()"
          >
            <mat-icon>cloud_upload</mat-icon> Importar
          </button>
          <a
            *ngIf="permissionService.hasPermission('employee:create')"
            mat-flat-button
            color="primary"
            routerLink="new"
          >
            <mat-icon>add</mat-icon> Novo Funcionário
          </a>
        </div>
      </div>

      <div class="mat-elevation-z2 rounded-lg overflow-hidden bg-white">
        <!-- Filters Header -->
        <div
          *ngIf="showFilters"
          class="p-4 bg-gray-50 border-b flex gap-4 overflow-x-auto"
          [formGroup]="filterForm"
        >
          <mat-form-field
            appearance="outline"
            class="w-40 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Matrícula</mat-label>
            <input matInput formControlName="matricula" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="flex-1 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Nome</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="w-48 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Cargo / Setor</mat-label>
            <input matInput formControlName="role" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="w-40 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>Status</mat-label>
            <input matInput formControlName="status" placeholder="Ex: Ativo" />
          </mat-form-field>

          <button
            mat-icon-button
            (click)="clearFilters()"
            matTooltip="Limpar filtros"
          >
            <mat-icon>filter_alt_off</mat-icon>
          </button>
        </div>

        <table
          mat-table
          [dataSource]="dataSource"
          matSort
          matSortActive="name"
          matSortDirection="asc"
          class="w-full"
        >
          <!-- Matricula -->
          <ng-container matColumnDef="matricula">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Matrícula</th>
            <td mat-cell *matCellDef="let employee">
              {{ employee.matricula }}
            </td>
          </ng-container>

          <!-- Nome -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Nome</th>
            <td mat-cell *matCellDef="let employee">
              <div class="font-medium">
                {{ employee.firstName }} {{ employee.lastName }}
              </div>
              <div class="text-xs text-neutral-400">
                CPF: {{ employee.cpf }}
              </div>
            </td>
          </ng-container>

          <!-- Função/Setor -->
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>
              Cargo / Setor
            </th>
            <td mat-cell *matCellDef="let employee">
              <div>{{ employee.funcao }}</div>
              <div class="text-xs text-neutral-400">{{ employee.setor }}</div>
            </td>
          </ng-container>

          <!-- Status -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let employee">
              <span
                class="px-2 py-1 rounded text-xs font-semibold"
                [ngClass]="
                  employee.dataDemissao
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                "
              >
                {{ employee.dataDemissao ? 'Demitido' : 'Ativo' }}
              </span>
            </td>
          </ng-container>

          <!-- Ações -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Ações</th>
            <td mat-cell *matCellDef="let employee">
              <button
                *ngIf="permissionService.hasPermission('employee:update')"
                mat-icon-button
                color="primary"
                [routerLink]="[employee.id, 'edit']"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                *ngIf="permissionService.hasPermission('employee:delete')"
                mat-icon-button
                color="warn"
                (click)="deleteEmployee(employee.id)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

          <tr class="mat-row" *matNoDataRow>
            <td
              class="mat-cell text-center py-6 text-neutral-500"
              [attr.colspan]="displayedColumns.length"
            >
              Nenhum funcionário encontrado com os filtros atuais.
            </td>
          </tr>
        </table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          aria-label="Selecione a página de funcionários"
        ></mat-paginator>
      </div>
    </div>
  `,
  styles: [
    `
      .dense-form-field .mat-mdc-form-field-wrapper {
        padding-bottom: 0;
      }
    `,
  ],
})
export class EmployeeListComponent implements OnInit, AfterViewInit {
  public permissionService = inject(PermissionService);
  private employeesService = inject(EmployeesService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  dataSource = new MatTableDataSource<IEmployee>([]);
  displayedColumns: string[] = [
    'matricula',
    'name',
    'role',
    'status',
    'actions',
  ];
  showFilters = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm = new FormGroup({
    matricula: new FormControl(''),
    name: new FormControl(''),
    role: new FormControl(''),
    status: new FormControl(''),
  });

  ngOnInit() {
    this.setupFilterPredicate();
    this.setupSortingAccessor();
    this.initialLoad();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  setupSortingAccessor() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return (item.firstName + ' ' + item.lastName).toLowerCase();
        case 'role':
          return (item.funcao + ' ' + item.setor).toLowerCase();
        case 'status':
          return item.dataDemissao ? 'demitido' : 'ativo';
        case 'matricula':
          return item.matricula ? item.matricula.toLowerCase() : '';
        default:
          return (item as any)[property];
      }
    };
  }

  initialLoad() {
    this.employeesService.getAll().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar funcionários', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: IEmployee, filter: string) => {
      const filters = JSON.parse(filter);

      const matchMatricula =
        !filters.matricula ||
        data.matricula?.toLowerCase().includes(filters.matricula);
      const fullName = (data.firstName + ' ' + data.lastName).toLowerCase();
      const matchName = !filters.name || fullName.includes(filters.name);

      const roleSector = (data.funcao + ' ' + data.setor).toLowerCase();
      const matchRole = !filters.role || roleSector.includes(filters.role);

      const status = data.dataDemissao ? 'demitido' : 'ativo';
      const matchStatus = !filters.status || status.includes(filters.status);

      return matchMatricula && matchName && matchRole && matchStatus;
    };
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const filterString = JSON.stringify({
      matricula: filters.matricula?.toLowerCase() || '',
      name: filters.name?.toLowerCase() || '',
      role: filters.role?.toLowerCase() || '',
      status: filters.status?.toLowerCase() || '',
    });
    this.dataSource.filter = filterString;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }

  deleteEmployee(id: string) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Excluir Funcionário',
        message:
          'Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.',
        confirmText: 'Excluir',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        // Confirmed, now check for linked meals
        this.employeesService
          .countLinkedMeals(id)
          .pipe(
            switchMap((res) => {
              if (res.count > 0) {
                const dismissalDialogRef = this.dialog.open(
                  DismissalMealsDialogComponent,
                  {
                    data: { count: res.count },
                    disableClose: true,
                    width: '600px',
                  }
                );
                return dismissalDialogRef.afterClosed();
              }
              return of(null); // No meals, proceed with null action (standard delete)
            })
          )
          .subscribe((mealsAction) => {
            // If undefined, dialog was cancelled/closed without choice (if allowed, but here we expect choice or check cancellation)
            // With disableClose: true, user picks or we handle close.
            // If we strictly want to stop if cancelled:
            if (mealsAction === undefined) return;

            // Perform delete
            this.employeesService
              .delete(id, (mealsAction as string) || undefined)
              .subscribe({
                next: () => {
                  this.snackBar.open('Funcionário excluído com sucesso', 'OK', {
                    duration: 3000,
                  });
                  this.initialLoad();
                },
                error: (err) => {
                  console.error(err);
                  const msg =
                    err.error?.message || 'Erro ao excluir funcionário';
                  this.snackBar.open(msg, 'OK', {
                    duration: 3000,
                  });
                },
              });
          });
      }
    });
  }

  openImportDialog() {
    const dialogRef = this.dialog.open(EmployeeImportDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.snackBar.open('Importação concluída com sucesso!', 'OK', {
          duration: 3000,
        });
        this.initialLoad();
      }
    });
  }
}
