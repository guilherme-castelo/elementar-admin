import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MealsService } from '../../../core/services/meals.service';
import { IMeal } from '../../../core/models/meal.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unlinked-meals-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    RouterModule
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-amber-500">warning</mat-icon>
      Refeições sem Vínculo
    </h2>
    
    <mat-dialog-content class="mat-typography max-h-[80vh] min-w-[500px]">
      <p class="mb-4 text-neutral-600">
        As seguintes refeições foram importadas mas não estão vinculadas a nenhum funcionário cadastrado.
        Cadastre os funcionários com as matrículas correspondentes para regularizar.
      </p>

      <div class="border rounded-lg overflow-hidden">
        <table mat-table [dataSource]="groupedDataSource" class="w-full">
          
          <!-- Matricula -->
          <ng-container matColumnDef="matricula">
            <th mat-header-cell *matHeaderCellDef> Matrícula </th>
            <td mat-cell *matCellDef="let item"> 
              <span class="font-mono bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold">
                {{ item.matricula }}
              </span>
            </td>
          </ng-container>

          <!-- Nome no Funcionário -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef> Funcionário </th>
            <td mat-cell *matCellDef="let item"> {{ item.originalName }} </td>
          </ng-container>

          <!-- Qtd -->
          <ng-container matColumnDef="count">
            <th mat-header-cell *matHeaderCellDef> Refeições </th>
            <td mat-cell *matCellDef="let item"> {{ item.count }} </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Ações </th>
            <td mat-cell *matCellDef="let item" class="text-right">
              <a mat-stroked-button color="primary" 
                 [routerLink]="['/employees/new']" 
                 [queryParams]="{ matricula: item.matricula, name: item.originalName }"
                 (click)="close()">
                <mat-icon>person_add</mat-icon> Cadastrar
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns; sticky: true"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
      
      <div *ngIf="isLoading" class="p-4 text-center text-neutral-500">
        Carregando...
      </div>

      <div *ngIf="!isLoading && groupedDataSource.length === 0" class="p-8 text-center text-neutral-500 bg-gray-50 rounded mt-4">
        <mat-icon class="text-4xl mb-2 text-green-500">check_circle</mat-icon>
        <p>Tudo certo! Nenhuma refeição pendente.</p>
      </div>

    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Fechar</button>
    </mat-dialog-actions>
  `
})
export class UnlinkedMealsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UnlinkedMealsDialogComponent>);
  private mealsService = inject(MealsService);

  displayedColumns = ['matricula', 'name', 'count', 'actions'];
  groupedDataSource: any[] = [];
  isLoading = true;

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.isLoading = true;
    this.mealsService.getPendingMeals().subscribe({
      next: (meals) => {
        this.groupedDataSource = this.groupMealsByMatricula(meals);
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  groupMealsByMatricula(meals: IMeal[]) {
    const groups: Record<string, { matricula: string, originalName: string, count: number }> = {};
    
    meals.forEach(meal => {
      const mat = meal.matriculaSnapshot || 'N/A';
      if (!groups[mat]) {
        groups[mat] = {
          matricula: mat,
          originalName: meal.employeeNameSnapshot || 'Desconhecido',
          count: 0
        };
      }
      groups[mat].count++;
    });

    return Object.values(groups);
  }

  close() {
    this.dialogRef.close();
  }
}
