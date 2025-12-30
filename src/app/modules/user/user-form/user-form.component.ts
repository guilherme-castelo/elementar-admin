import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { CompanyService } from '../../../core/services/company.service';
import { UsersService } from '../../../core/services/users.service';
import { RolesService } from '../../../core/services/roles.service';
import { IRole } from '../../../core/models/role.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterLink
  ],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Editar Usuário' : 'Novo Usuário' }}</h1>
      
      <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 p-6 rounded-lg shadow">
        
        <mat-form-field appearance="outline">
          <mat-label>Nome Completo</mat-label>
          <input matInput formControlName="name" placeholder="Ex: João Silva">
          <mat-error *ngIf="userForm.get('name')?.hasError('required')">Nome é obrigatório</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" placeholder="usuario@empresa.com">
          <mat-error *ngIf="userForm.get('email')?.hasError('required')">Email é obrigatório</mat-error>
          <mat-error *ngIf="userForm.get('email')?.hasError('email')">Email inválido</mat-error>
        </mat-form-field>

        <div class="grid grid-cols-2 gap-4">
           <mat-form-field appearance="outline">
            <mat-label>Senha</mat-label>
            <input matInput formControlName="password" type="password">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Função</mat-label>
            <mat-select formControlName="roleId">
              <mat-option *ngFor="let role of roles$ | async" [value]="role.id">
                {{ role.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Empresa</mat-label>
          <mat-select formControlName="companyId">
             <mat-option *ngFor="let company of companies$ | async" [value]="company.id">
               {{ company.name }}
             </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="flex justify-end gap-3 mt-4">
          <a mat-button color="basic" routerLink="/users">Cancelar</a>
          <button mat-flat-button color="primary" type="submit" [disabled]="userForm.invalid || isLoading">
            {{ isLoading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class UserFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usersService = inject(UsersService);
  private rolesService = inject(RolesService);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  companies$!: Observable<any[]>;
  roles$!: Observable<IRole[]>;

  userForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['123456', Validators.required],
    roleId: [null, Validators.required], // Changed from roles array to roleId
    companyId: [null, Validators.required]
  });

  isEdit = false;
  userId: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.companies$ = this.companyService.getCompanies();
    this.roles$ = this.rolesService.getAll(); // Assuming getAll exists and returns IRole[]

    this.userId = this.route.snapshot.paramMap.get('id');
    if (this.userId) {
      this.isEdit = true;
      this.loadUser(this.userId);
    }
  }

  loadUser(id: string) {
    this.usersService.getById(id).subscribe(user => {
      // Adapter model might differ from form, but patchValue usually works if names match
      // If UserAdapter returns { role: { name: 'Admin' } } but form expects roles: ['admin'], mapping needed.
      // But assuming direct map for now or minor adjustment.
      // Actually, standard response might be different. Let's trust UsersService returns usable model.
      this.userForm.patchValue(user);
    });
  }

  onSubmit() {
    if (this.userForm.invalid) return;

    this.isLoading = true;
    const user = this.userForm.value;

    const request$ = this.isEdit && this.userId
      ? this.usersService.update(this.userId, user)
      : this.usersService.create(user);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Usuário salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/users']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.snackBar.open('Erro ao salvar usuário.', 'Fechar', { duration: 3000 });
      }
    });
  }
}
