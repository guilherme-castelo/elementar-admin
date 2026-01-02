import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { EmployeesService } from '../../../core/services/employees.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IEmployee } from '../../../core/models/employee.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EmployeeImportDialogComponent } from '../employee-import-dialog/employee-import-dialog.component';
import { DismissalMealsDialogComponent } from '../dismissal-meals-dialog/dismissal-meals-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { switchMap, of } from 'rxjs';
import {
  DataTableComponent,
  TableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    RouterLink,
    DataTableComponent,
  ],
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

      <app-data-table
        [data]="data"
        [columns]="tableColumns"
        [filters]="filterConfig"
        [showFilters]="showFilters"
        [filterPredicate]="filterPredicate"
        defaultSortActive="name"
        defaultSortDirection="asc"
      ></app-data-table>

      <ng-template #actionsTemplate let-employee>
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
      </ng-template>
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

  data: IEmployee[] = [];
  tableColumns: TableColumn[] = [];
  showFilters = false;

  filterConfig: FilterConfig[] = [
    { key: 'matricula', label: 'Matrícula', widthClass: 'w-40' },
    { key: 'name', label: 'Nome', widthClass: 'flex-1' },
    { key: 'role', label: 'Cargo / Setor', widthClass: 'w-48' },
    { key: 'status', label: 'Status', widthClass: 'w-40' },
  ];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  filterPredicate = (data: IEmployee, filter: string) => {
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

  ngOnInit() {
    this.initialLoad();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.tableColumns = [
        { def: 'matricula', header: 'Matrícula' },
        {
          def: 'name',
          header: 'Nome',
          content: (row) => `
                <div class="font-medium">${row.firstName} ${row.lastName}</div>
                <div class="text-xs text-neutral-400">CPF: ${row.cpf}</div>
               `,
          sortAccessor: (row) =>
            (row.firstName + ' ' + row.lastName).toLowerCase(),
        },
        {
          def: 'role',
          header: 'Cargo / Setor',
          content: (row) => `
                <div>${row.funcao}</div>
                <div class="text-xs text-neutral-400">${row.setor}</div>
               `,
          sortAccessor: (row) => (row.funcao + ' ' + row.setor).toLowerCase(),
        },
        {
          def: 'status',
          header: 'Status',
          content: (row) => {
            const isDismissed = !!row.dataDemissao;
            const classes = isDismissed
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700';
            const label = isDismissed ? 'Demitido' : 'Ativo';
            return `<span class="px-2 py-1 rounded text-xs font-semibold ${classes}">${label}</span>`;
          },
          sortAccessor: (row) => (row.dataDemissao ? 'demitido' : 'ativo'),
        },
        {
          def: 'actions',
          header: 'Ações',
          template: this.actionsTemplate,
          sortable: false,
        },
      ];
    });
  }

  initialLoad() {
    this.employeesService.getAll().subscribe({
      next: (data) => {
        this.data = data;
      },
      error: () => {
        this.snackBar.open('Erro ao carregar funcionários', 'Fechar', {
          duration: 3000,
        });
      },
    });
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
              return of(null);
            })
          )
          .subscribe((mealsAction) => {
            if (mealsAction === undefined) return;
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
                  this.snackBar.open(msg, 'OK', { duration: 3000 });
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
