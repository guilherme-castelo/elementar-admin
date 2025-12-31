import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';
import { UsersService } from '../../../core/services/users.service';
import { IUser } from '../../../core/models/user.model';

@Component({
  selector: 'app-company-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    RouterLink,
    MatTabsModule,
    MatSelectModule,
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          {{ isEdit ? 'Editar Empresa' : 'Nova Empresa' }}
        </h1>
        <a mat-button color="basic" routerLink="/companies">Voltar</a>
      </div>

      <form
        [formGroup]="companyForm"
        (ngSubmit)="onSubmit()"
        class="rounded-lg shadow overflow-hidden bg-white dark:bg-neutral-800"
      >
        <mat-tab-group animationDuration="0ms">
          <!-- General Tab -->
          <mat-tab label="Geral">
            <div class="p-6 flex flex-col gap-4">
              <mat-form-field appearance="outline">
                <mat-label>Nome da Empresa</mat-label>
                <input
                  matInput
                  formControlName="name"
                  placeholder="Ex: Tech Solutions"
                />
                <mat-error *ngIf="companyForm.get('name')?.hasError('required')"
                  >Nome é obrigatório</mat-error
                >
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>CNPJ</mat-label>
                <input
                  matInput
                  formControlName="cnpj"
                  placeholder="00.000.000/0000-00"
                />
                <mat-error *ngIf="companyForm.get('cnpj')?.hasError('required')"
                  >CNPJ é obrigatório</mat-error
                >
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Gerente Responsável</mat-label>
                <mat-select formControlName="managerId">
                  <mat-option [value]="null">-- Nenhum --</mat-option>
                  <mat-option *ngFor="let user of users" [value]="user.id">
                    {{ user.name }} ({{ user.email }})
                  </mat-option>
                </mat-select>
                <mat-hint
                  >O usuário selecionado terá acesso total a esta
                  empresa</mat-hint
                >
              </mat-form-field>
            </div>
          </mat-tab>

          <!-- Integrations Tab -->
          <mat-tab label="Integrações">
            <div class="p-6">
              <h3
                class="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100"
              >
                Domínio Sistemas
              </h3>
              <p class="text-sm text-gray-500 mb-6 dark:text-neutral-400">
                Configure os parâmetros para exportação de dados para a folha de
                pagamento.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <mat-form-field appearance="outline">
                  <mat-label>Código da Empresa (Domínio)</mat-label>
                  <input
                    matInput
                    formControlName="dominioCode"
                    placeholder="Ex: 100"
                    maxlength="10"
                  />
                  <mat-hint>Utilizado na exportação de refeições</mat-hint>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Código da Rubrica (Refeição)</mat-label>
                  <input
                    matInput
                    formControlName="dominioRubric"
                    placeholder="Ex: 287"
                    maxlength="9"
                  />
                  <mat-hint>Código da rubrica na folha de pagamento</mat-hint>
                </mat-form-field>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>

        <div
          class="p-6 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3"
        >
          <a mat-button color="basic" routerLink="/companies">Cancelar</a>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="companyForm.invalid || isLoading"
          >
            {{ isLoading ? 'Salvando...' : 'Salvar Alterações' }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CompanyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private usersService = inject(UsersService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  companyForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    cnpj: ['', Validators.required],
    managerId: [null],
    dominioCode: [''],
    dominioRubric: [''],
  });

  isEdit = false;
  companyId: string | null = null;
  isLoading = false;
  users: IUser[] = [];

  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get('id');
    this.loadUsers();

    if (this.companyId) {
      this.isEdit = true;
      this.loadCompany(this.companyId);
    }
  }

  loadUsers() {
    this.usersService.getAll().subscribe((users) => {
      this.users = users;
    });
  }

  loadCompany(id: string) {
    this.companyService.getCompany(id).subscribe((company) => {
      this.companyForm.patchValue(company);
    });
  }

  onSubmit() {
    if (this.companyForm.invalid) return;

    this.isLoading = true;
    const company = this.companyForm.value;

    const request$ = this.isEdit
      ? this.companyService.updateCompany(this.companyId!, company)
      : this.companyService.createCompany(company);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Empresa salva com sucesso!', 'Fechar', {
          duration: 3000,
        });
        this.router.navigate(['/companies']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        const msg = err.error?.message || 'Erro ao salvar empresa.';
        this.snackBar.open(msg, 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
        });
      },
    });
  }
}
