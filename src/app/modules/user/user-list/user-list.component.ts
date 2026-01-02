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
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PermissionService } from '../../../core/services/permission.service';
import { UsersService } from '../../../core/services/users.service';
import {
  DataTableComponent,
  TableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    DataTableComponent,
  ],
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
        <app-data-table
          [data]="data"
          [columns]="tableColumns"
          [filters]="filterConfig"
          [showFilters]="showFilters"
          [filterPredicate]="filterPredicate"
        ></app-data-table>

        <ng-template #actionsTemplate let-user>
          <button mat-icon-button color="accent" [routerLink]="[user.id]">
            <mat-icon>edit</mat-icon>
          </button>
          <button mat-icon-button color="warn">
            <mat-icon>delete</mat-icon>
          </button>
        </ng-template>
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
export class UserListComponent implements OnInit, AfterViewInit {
  private usersService = inject(UsersService);
  public permissionService = inject(PermissionService);

  data: any[] = [];
  tableColumns: TableColumn[] = [];
  showFilters = false;

  filterConfig: FilterConfig[] = [
    { key: 'id', label: 'ID', widthClass: 'w-24' },
    { key: 'name', label: 'Nome / Email', widthClass: 'flex-1' },
    { key: 'role', label: 'Função', widthClass: 'w-48' },
  ];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  filterPredicate = (data: any, filter: string) => {
    const filters = JSON.parse(filter);
    const matchId = !filters.id || data.id.toString().includes(filters.id);
    const nameEmail = (data.name + ' ' + data.email).toLowerCase();
    const matchName = !filters.name || nameEmail.includes(filters.name);
    const matchRole =
      !filters.role ||
      (data.roles && data.roles.toLowerCase().includes(filters.role));
    return matchId && matchName && matchRole;
  };

  ngOnInit() {
    this.initialLoad();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.tableColumns = [
        { def: 'id', header: 'ID' },
        {
          def: 'name',
          header: 'Nome',
          content: (row) =>
            `<div class="font-medium">${row.name}</div><div class="text-xs text-gray-500 dark:text-neutral-400">${row.email}</div>`,
          sortAccessor: (row) => (row.name + ' ' + row.email).toLowerCase(),
        },
        { def: 'roles', header: 'Função' }, // Note: assuming 'roles' property exists on row
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
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.data = data;
      },
      error: () => console.error('Erro ao carregar usuários'),
    });
  }
}
