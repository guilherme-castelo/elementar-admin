import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';
import { RolesService } from '../../../core/services/roles.service';
import { IRole } from '../../../core/models/role.model';
import { PermissionService } from '../../../core/services/permission.service';
import {
  DataTableComponent,
  TableColumn,
  FilterConfig,
} from '../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    DataTableComponent,
  ],
  templateUrl: './role-list.component.html',
  styles: [
    `
      .dense-form-field .mat-mdc-form-field-wrapper {
        padding-bottom: 0;
      }
    `,
  ],
})
export class RoleListComponent implements OnInit, AfterViewInit {
  private rolesService = inject(RolesService);
  public permissionService = inject(PermissionService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  data: IRole[] = [];
  tableColumns: TableColumn[] = [];
  showFilters = false;

  filterConfig: FilterConfig[] = [
    { key: 'id', label: 'ID', widthClass: 'w-24' },
    { key: 'name', label: 'Nome', widthClass: 'flex-1' },
    { key: 'description', label: 'Descrição', widthClass: 'w-1/3' },
  ];

  @ViewChild('actionsTemplate') actionsTemplate!: TemplateRef<any>;

  // Predicate
  filterPredicate = (data: IRole, filter: string) => {
    const filters = JSON.parse(filter);
    const matchId = !filters.id || data.id.toString().includes(filters.id);
    const matchName =
      !filters.name || data.name.toLowerCase().includes(filters.name);
    const description = data.description ? data.description.toLowerCase() : '';
    const matchDescription =
      !filters.description || description.includes(filters.description);
    return matchId && matchName && matchDescription;
  };

  ngOnInit() {
    this.loadRoles();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.tableColumns = [
        { def: 'id', header: 'ID', content: (row) => `#${row.id}` },
        {
          def: 'name',
          header: 'Nome',
          content: (row) => `<div class="font-medium">${row.name}</div>`,
        },
        {
          def: 'description',
          header: 'Descrição',
          content: (row) =>
            `<span class="text-gray-500">${row.description || '-'}</span>`,
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

  loadRoles() {
    this.rolesService.getAll().subscribe({
      next: (data) => (this.data = data),
      error: (err) => console.error('Error loading roles', err),
    });
  }

  deleteRole(id: number) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Excluir Cargo',
        message: 'Tem certeza que deseja excluir este cargo?',
        confirmText: 'Excluir',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.rolesService.delete(id).subscribe({
          next: () => {
            this.loadRoles();
            this.snackBar.open('Cargo excluído com sucesso', 'OK', {
              duration: 3000,
            });
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open(
              'Erro ao excluir cargo. Verifique se existem usuários vinculados.',
              'Fechar',
              { duration: 5000, panelClass: ['bg-red-600', 'text-white'] }
            );
          },
        });
      }
    });
  }
}
