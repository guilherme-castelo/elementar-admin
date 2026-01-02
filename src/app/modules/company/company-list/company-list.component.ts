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
import {
  MatPaginatorModule,
  MatPaginator,
  MatPaginatorIntl,
} from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { PermissionService } from '../../../core/services/permission.service';
import { getPtBrPaginatorIntl } from '../../../shared/helpers/paginator-intl';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
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
            <mat-label>Nome</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>

          <mat-form-field
            appearance="outline"
            class="w-48 dense-form-field"
            subscriptSizing="dynamic"
          >
            <mat-label>CNPJ</mat-label>
            <input matInput formControlName="cnpj" />
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
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th
              mat-header-cell
              *matHeaderCellDef
              mat-sort-header
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              ID
            </th>
            <td
              mat-cell
              *matCellDef="let company"
              class="dark:text-neutral-300"
            >
              {{ company.id }}
            </td>
          </ng-container>

          <!-- Name Column -->
          <ng-container matColumnDef="name">
            <th
              mat-header-cell
              *matHeaderCellDef
              mat-sort-header
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              Nome
            </th>
            <td
              mat-cell
              *matCellDef="let company"
              class="dark:text-neutral-300"
            >
              <div class="font-medium">{{ company.name }}</div>
            </td>
          </ng-container>

          <!-- CNPJ Column -->
          <ng-container matColumnDef="cnpj">
            <th
              mat-header-cell
              *matHeaderCellDef
              mat-sort-header
              class="dark:bg-neutral-800 dark:text-neutral-200"
            >
              CNPJ
            </th>
            <td
              mat-cell
              *matCellDef="let company"
              class="dark:text-neutral-300"
            >
              {{ company.cnpj }}
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
            <td
              mat-cell
              *matCellDef="let company"
              class="dark:text-neutral-300"
            >
              <button
                *ngIf="permissionService.hasPermission('company:update')"
                mat-icon-button
                color="accent"
                [routerLink]="[company.id]"
              >
                <mat-icon>edit</mat-icon>
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
              Nenhuma empresa encontrada com os filtros atuais.
            </td>
          </tr>
        </table>

        <mat-paginator
          [pageSizeOptions]="[10, 25, 50, 100]"
          aria-label="Selecione a página de empresas"
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
export class CompanyListComponent implements OnInit, AfterViewInit {
  public permissionService = inject(PermissionService);
  private companyService = inject(CompanyService);

  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = ['id', 'name', 'cnpj', 'actions'];
  showFilters = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  filterForm = new FormGroup({
    id: new FormControl(''),
    name: new FormControl(''),
    cnpj: new FormControl(''),
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
    this.dataSource.sort = this.sort;
  }

  initialLoad() {
    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: () => console.error('Erro ao carregar empresas'),
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const filters = JSON.parse(filter);

      const matchId = !filters.id || data.id.toString().includes(filters.id);
      const matchName =
        !filters.name || data.name.toLowerCase().includes(filters.name);
      const matchCnpj = !filters.cnpj || data.cnpj.includes(filters.cnpj);

      return matchId && matchName && matchCnpj;
    };
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const filterString = JSON.stringify({
      id: filters.id || '',
      name: filters.name?.toLowerCase() || '',
      cnpj: filters.cnpj || '',
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
