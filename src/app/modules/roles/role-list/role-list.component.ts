import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RolesService } from '../../../core/services/roles.service';
import { IRole } from '../../../core/models/role.model';
import { PermissionService } from '../../../core/services/permission.service';

@Component({
  selector: 'app-role-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './role-list.component.html'
})
export class RoleListComponent implements OnInit {
  private rolesService = inject(RolesService);
  public permissionService = inject(PermissionService);
  
  roles: IRole[] = [];
  displayedColumns: string[] = ['id', 'name', 'description', 'actions'];

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.rolesService.getAll().subscribe({
      next: (data) => this.roles = data,
      error: (err) => console.error('Error loading roles', err)
    });
  }

  deleteRole(id: number) {
    if (confirm('Tem certeza que deseja excluir este cargo?')) {
      this.rolesService.delete(id).subscribe({
        next: () => this.loadRoles(),
        error: (err) => alert('Erro ao excluir cargo. Verifique se existem usuários vinculados.')
      });
    }
  }
}
