import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CompanyService } from '../../../core/services/company.service';

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
    RouterLink
  ],
  template: `
    <div class="p-6 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-6">{{ isEdit ? 'Editar Empresa' : 'Nova Empresa' }}</h1>
      
      <form [formGroup]="companyForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4 p-6 rounded-lg shadow">
        
        <mat-form-field appearance="outline">
          <mat-label>Nome da Empresa</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Tech Solutions">
          <mat-error *ngIf="companyForm.get('name')?.hasError('required')">Nome é obrigatório</mat-error>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>CNPJ</mat-label>
          <input matInput formControlName="cnpj" placeholder="00.000.000/0000-00">
          <mat-error *ngIf="companyForm.get('cnpj')?.hasError('required')">CNPJ é obrigatório</mat-error>
        </mat-form-field>

        <div class="flex justify-end gap-3 mt-4">
          <a mat-button color="basic" routerLink="/companies">Cancelar</a>
          <button mat-flat-button color="primary" type="submit" [disabled]="companyForm.invalid || isLoading">
            {{ isLoading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  `
})
export class CompanyFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private companyService = inject(CompanyService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  companyForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    cnpj: ['', Validators.required]
  });

  isEdit = false;
  companyId: string | null = null;
  isLoading = false;

  ngOnInit() {
    this.companyId = this.route.snapshot.paramMap.get('id');
    if (this.companyId) {
      this.isEdit = true;
      this.loadCompany(this.companyId);
    }
  }

  loadCompany(id: string) {
    this.companyService.getCompany(id).subscribe(company => {
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
        this.snackBar.open('Empresa salva com sucesso!', 'Fechar', { duration: 3000 });
        this.router.navigate(['/companies']);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.snackBar.open('Erro ao salvar empresa.', 'Fechar', { duration: 3000 });
      }
    });
  }
}
