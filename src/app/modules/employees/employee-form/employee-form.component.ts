import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmployeesService } from '../../../core/services/employees.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatSnackBarModule,
    RouterLink
  ],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <div class="mb-6">
        <h1 class="text-2xl font-bold">{{ isEdit ? 'Editar Funcionário' : 'Novo Funcionário' }}</h1>
        <p class="text-neutral-500">Preencha as informações abaixo</p>
      </div>
      
      <form [formGroup]="employeeForm" (ngSubmit)="onSubmit()" class="p-8 rounded-lg shadow-sm border border-neutral-200">
        
        <!-- Identificação -->
        <h2 class="text-lg font-semibold mb-4 text-primary-700 border-b pb-2">Identificação</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
           <mat-form-field appearance="outline">
            <mat-label>Matrícula</mat-label>
            <input matInput formControlName="matricula" placeholder="Ex: 1234">
            <mat-error *ngIf="employeeForm.get('matricula')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Nome</mat-label>
            <input matInput formControlName="firstName" placeholder="Ex: João">
            <mat-error *ngIf="employeeForm.get('firstName')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Sobrenome</mat-label>
            <input matInput formControlName="lastName" placeholder="Ex: Silva">
            <mat-error *ngIf="employeeForm.get('lastName')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>CPF</mat-label>
            <input matInput formControlName="cpf" placeholder="000.000.000-00">
            <mat-error *ngIf="employeeForm.get('cpf')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>
        </div>

        <!-- Cargo e Setor -->
        <h2 class="text-lg font-semibold mb-4 mt-6 text-primary-700 border-b pb-2">Cargo e Setor</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Função / Cargo</mat-label>
            <input matInput formControlName="funcao" placeholder="Ex: Desenvolvedor">
            <mat-error *ngIf="employeeForm.get('funcao')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Setor / Departamento</mat-label>
            <input matInput formControlName="setor" placeholder="Ex: TI">
            <mat-error *ngIf="employeeForm.get('setor')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>
        </div>

        <!-- Datas -->
        <h2 class="text-lg font-semibold mb-4 mt-6 text-primary-700 border-b pb-2">Contrato</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <mat-form-field appearance="outline">
            <mat-label>Data de Admissão</mat-label>
            <input matInput [matDatepicker]="admissaoPicker" formControlName="dataAdmissao">
            <mat-datepicker-toggle matIconSuffix [for]="admissaoPicker"></mat-datepicker-toggle>
            <mat-datepicker #admissaoPicker></mat-datepicker>
            <mat-error *ngIf="employeeForm.get('dataAdmissao')?.hasError('required')">Obrigatório</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Data de Demissão (Opcional)</mat-label>
            <input matInput [matDatepicker]="demissaoPicker" formControlName="dataDemissao">
            <mat-datepicker-toggle matIconSuffix [for]="demissaoPicker"></mat-datepicker-toggle>
            <mat-datepicker #demissaoPicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <a mat-button color="basic" routerLink="/employees">Cancelar</a>
          <button mat-flat-button color="primary" type="submit" [disabled]="employeeForm.invalid || isLoading">
            {{ isLoading ? 'Salvando...' : 'Salvar Funcionário' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class EmployeeFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private employeesService = inject(EmployeesService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  employeeForm: FormGroup = this.fb.group({
    matricula: ['', Validators.required],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    cpf: ['', Validators.required],
    funcao: ['', Validators.required],
    setor: ['', Validators.required],
    dataAdmissao: [new Date(), Validators.required],
    dataDemissao: [null],
    companyId: ['']
  });

  isEdit = false;
  employeeId: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.employeeId = this.route.snapshot.paramMap.get('id');

    // Auto-fill company from user session (assuming single tenant context per user for simplicity)
    // In a real multi-company user setup, this might come from a selected context.
    // For now, let's grab the first role's company or just a mock company ID if not present.
    // Actually, user object in AuthService (from db.json) doesn't strictly have companyId.
    // Let's assume the user belongs to company "1" for this MVP.
    const user = this.authService.getUser();
    // Assuming for now companyId 1. In real app, user.companyId.
    this.employeeForm.patchValue({ companyId: user?.companyId || '1' });

    if (this.employeeId) {
      this.isEdit = true;
      this.loadEmployee(this.employeeId);
    } else {
        // Check for query params to pre-fill (e.g. from Unlinked Meals)
        this.route.queryParams.subscribe(params => {
            if (params['matricula']) {
                this.employeeForm.patchValue({ matricula: params['matricula'] });
            }
            if (params['name']) {
                // Simple split for first/last name guess
                const parts = (params['name'] || '').split(' ');
                const firstName = parts[0] || '';
                const lastName = parts.slice(1).join(' ') || '';
                
                this.employeeForm.patchValue({
                    firstName: firstName,
                    lastName: lastName
                });
            }
        });
    }
  }

  loadEmployee(id: string) {
    this.employeesService.getById(id).subscribe(employee => {
      this.employeeForm.patchValue({
        ...employee,
        dataAdmissao: employee.dataAdmissao ? new Date(employee.dataAdmissao) : null,
        dataDemissao: employee.dataDemissao ? new Date(employee.dataDemissao) : null
      });
    });
  }

  onSubmit() {
    if (this.employeeForm.invalid) return;

    this.isLoading = true;
    const formValue = this.employeeForm.value;

    // Convert Dates to ISO strings
    const employeeData = {
      ...formValue,
      dataAdmissao: formValue.dataAdmissao ? formValue.dataAdmissao.toISOString() : null,
      dataDemissao: formValue.dataDemissao ? formValue.dataDemissao.toISOString() : null
    };

    const request$ = this.isEdit
      ? this.employeesService.update(this.employeeId!, employeeData)
      : this.employeesService.create(employeeData);

    request$.subscribe({
      next: () => {
        this.snackBar.open('Funcionário salvo com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/employees']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        const msg = err.error?.message || 'Erro ao salvar funcionário.';
        this.snackBar.open(msg, 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      }
    });
  }
}
