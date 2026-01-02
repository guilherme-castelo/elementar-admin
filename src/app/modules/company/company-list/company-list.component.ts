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
import { RouterLink } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { PermissionService } from '../../../core/services/permission.service';
import {
  DataTableComponent,
  TableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-company-list',
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
          Gerenciamento de Empresas
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
            *ngIf="permissionService.hasPermission('company:create')"
            mat-flat-button
            color="primary"
            routerLink="new"
          >
            <mat-icon>add</mat-icon> Nova Empresa
          </a>
        </div>
      </div>

      <app-data-table
        [data]="data"
        [columns]="tableColumns"
        [filters]="filterConfig"
        [showFilters]="showFilters"
        [filterPredicate]="filterPredicate"
      ></app-data-table>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-company>
        <button
          *ngIf="permissionService.hasPermission('company:update')"
          mat-icon-button
          color="accent"
          [routerLink]="[company.id]"
        >
          <mat-icon>edit</mat-icon>
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
export class CompanyListComponent implements OnInit, AfterViewInit {
  public permissionService = inject(PermissionService);
  private companyService = inject(CompanyService);

  // Data for the generic table
  data: any[] = [];
  tableColumns: TableColumn[] = [];

  showFilters = false;

  filterConfig: FilterConfig[] = [
    { key: 'id', label: 'ID', widthClass: 'w-24' },
    { key: 'name', label: 'Nome', widthClass: 'flex-1' },
    { key: 'cnpj', label: 'CNPJ', widthClass: 'w-48' },
  ];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Predicate function
  filterPredicate = (data: any, filter: string) => {
    const filters = JSON.parse(filter);
    const matchId = !filters.id || data.id.toString().includes(filters.id);
    const matchName =
      !filters.name || data.name.toLowerCase().includes(filters.name);
    const matchCnpj = !filters.cnpj || data.cnpj.includes(filters.cnpj);
    return matchId && matchName && matchCnpj;
  };

  ngOnInit() {
    this.initialLoad();
  }

  ngAfterViewInit() {
    // Define columns AFTER view init so we can access the template
    setTimeout(() => {
      this.tableColumns = [
        { def: 'id', header: 'ID' },
        {
          def: 'name',
          header: 'Nome',
          content: (row) => `<div class="font-medium">${row.name}</div>`,
        },
        { def: 'cnpj', header: 'CNPJ' },
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
    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.data = data;
      },
      error: () => console.error('Erro ao carregar empresas'),
    });
  }
}
