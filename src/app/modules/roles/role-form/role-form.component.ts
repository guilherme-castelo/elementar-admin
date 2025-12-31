import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { RolesService } from '../../../core/services/roles.service';
import { PermissionService } from '../../../core/services/permission.service';
import { IRole } from '../../../core/models/role.model';
import { IPermission } from '../../../core/models/permission.model';
import { CompanyService } from '../../../core/services/company.service';
import { ICompany } from '../../../core/models/company.model';

@Component({
  selector: 'app-role-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  templateUrl: './role-form.component.html',
})
export class RoleFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rolesService = inject(RolesService);
  private permissionService = inject(PermissionService);
  private companyService = inject(CompanyService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  form: FormGroup;
  isEditMode = false;
  roleId?: number;

  // Permissions grouped by module/feature (derived from slug prefix)
  groupedPermissions: { name: string; permissions: IPermission[] }[] = [];
  companies: ICompany[] = [];

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      permissions: [[]],
      companyIds: [[]],
    });
  }

  ngOnInit() {
    this.loadPermissions();
    this.loadCompanies();

    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.roleId = Number(params['id']);
        this.loadRole(this.roleId);
      }
    });
  }

  loadPermissions() {
    this.permissionService.getAll().subscribe((perms) => {
      this.groupPermissions(perms);
    });
  }

  groupPermissions(perms: IPermission[]) {
    const groups: { [key: string]: IPermission[] } = {};

    perms.forEach((p) => {
      const prefix = p.slug.split(':')[0] || 'outros';
      // Capitalize first letter
      const groupName = prefix.charAt(0).toUpperCase() + prefix.slice(1);

      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push(p);
    });

    this.groupedPermissions = Object.keys(groups)
      .map((key) => ({
        name: key,
        permissions: groups[key],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  loadCompanies() {
    this.companyService.getCompanies().subscribe((companies) => {
      this.companies = companies;
    });
  }

  loadRole(id: number) {
    this.rolesService.getById(id).subscribe((role) => {
      const permissionSlugs = role.permissions?.map((p) => p.slug) || [];
      const companyIds = role.companies?.map((c) => c.id) || [];

      this.form.patchValue({
        name: role.name,
        description: role.description,
        permissions: permissionSlugs,
        companyIds: companyIds,
      });
    });
  }

  toggleCompany(companyId: number) {
    const current = (this.form.get('companyIds')?.value as number[]) || [];
    if (current.includes(companyId)) {
      this.form.patchValue({
        companyIds: current.filter((id) => id !== companyId),
      });
    } else {
      this.form.patchValue({ companyIds: [...current, companyId] });
    }
  }

  isCompanySelected(companyId: number): boolean {
    const current = this.form.get('companyIds')?.value as number[];
    return current ? current.includes(companyId) : false;
  }

  togglePermission(slug: string) {
    const currentperms = this.form.get('permissions')?.value as string[];
    if (currentperms.includes(slug)) {
      this.form.patchValue({
        permissions: currentperms.filter((p) => p !== slug),
      });
    } else {
      this.form.patchValue({
        permissions: [...currentperms, slug],
      });
    }
  }

  isPermissionSelected(slug: string): boolean {
    const current = this.form.get('permissions')?.value as string[];
    return current ? current.includes(slug) : false;
  }

  // Toggle all permissions in a group
  toggleGroup(groupName: string, enable: boolean) {
    const group = this.groupedPermissions.find((g) => g.name === groupName);
    if (!group) return;

    let currentperms = (this.form.get('permissions')?.value as string[]) || [];
    const groupSlugs = group.permissions.map((p) => p.slug);

    if (enable) {
      // Add all from group that aren't already there
      const toAdd = groupSlugs.filter((s) => !currentperms.includes(s));
      currentperms = [...currentperms, ...toAdd];
    } else {
      // Remove all from group
      currentperms = currentperms.filter((s) => !groupSlugs.includes(s));
    }

    this.form.patchValue({ permissions: currentperms });
  }

  isGroupFullySelected(groupName: string): boolean {
    const group = this.groupedPermissions.find((g) => g.name === groupName);
    if (!group) return false;
    const currentperms = this.form.get('permissions')?.value as string[];
    return group.permissions.every((p) => currentperms.includes(p.slug));
  }

  isGroupPartiallySelected(groupName: string): boolean {
    const group = this.groupedPermissions.find((g) => g.name === groupName);
    if (!group) return false;
    const currentperms = this.form.get('permissions')?.value as string[];
    const selectedCount = group.permissions.filter((p) =>
      currentperms.includes(p.slug)
    ).length;
    return selectedCount > 0 && selectedCount < group.permissions.length;
  }

  save() {
    if (this.form.invalid) return;

    // Ensure permissions is array of strings (slugs)
    // The template logic updates the form control, so we just take the value.
    const roleData = this.form.value;

    const request$ =
      this.isEditMode && this.roleId
        ? this.rolesService.update(this.roleId, roleData)
        : this.rolesService.create(roleData);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Cargo salvo com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/roles']);
      },
      error: (err) => {
        console.error(err);
        const msg = err.error?.message || 'Erro ao salvar cargo.';
        this.snackBar.open(msg, 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
        });
      },
    });
  }
}
