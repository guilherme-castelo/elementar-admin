import {
  Component,
  inject,
  OnInit,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
import { RolesService } from '../../../core/services/roles.service';
import { IRole } from '../../../core/models/role.model';
import { PermissionService } from '../../../core/services/permission.service';
import { getPtBrPaginatorIntl } from '../../../shared/helpers/paginator-intl';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
  ],
  providers: [{ provide: MatPaginatorIntl, useValue: getPtBrPaginatorIntl() }],
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

  dataSource = new MatTableDataSource<IRole>([]);
  displayedColumns: string[] = ['id', 'name', 'description', 'actions'];
  showFilters = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filterForm = new FormGroup({
    id: new FormControl(''),
    name: new FormControl(''),
    description: new FormControl(''),
  });

  ngOnInit() {
    this.setupFilterPredicate();
    this.loadRoles();

    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  loadRoles() {
    this.rolesService.getAll().subscribe({
      next: (data) => (this.dataSource.data = data),
      error: (err) => console.error('Error loading roles', err),
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: IRole, filter: string) => {
      const filters = JSON.parse(filter);

      const matchId = !filters.id || data.id.toString().includes(filters.id);
      const matchName =
        !filters.name || data.name.toLowerCase().includes(filters.name);

      const description = data.description
        ? data.description.toLowerCase()
        : '';
      const matchDescription =
        !filters.description || description.includes(filters.description);

      return matchId && matchName && matchDescription;
    };
  }

  applyFilters() {
    const filters = this.filterForm.value;
    const filterString = JSON.stringify({
      id: filters.id || '',
      name: filters.name?.toLowerCase() || '',
      description: filters.description?.toLowerCase() || '',
    });
    this.dataSource.filter = filterString;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  clearFilters() {
    this.filterForm.reset();
  }

  deleteRole(id: number) {
    if (confirm('Tem certeza que deseja excluir este cargo?')) {
      this.rolesService.delete(id).subscribe({
        next: () => this.loadRoles(),
        error: (err) =>
          alert(
            'Erro ao excluir cargo. Verifique se existem usuários vinculados.'
          ),
      });
    }
  }
}
