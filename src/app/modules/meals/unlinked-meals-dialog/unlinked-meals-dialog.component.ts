import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MealsService } from '../../../core/services/meals.service';
import { IMeal } from '../../../core/models/meal.model';
import { RouterModule } from '@angular/router';
import { ConfirmationDialogComponent } from '../../../shared/components/confirmation-dialog/confirmation-dialog.component';

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
    MatSnackBarModule,
    MatProgressBarModule,
    RouterModule,
  ],
  template: `
    <h2 mat-dialog-title class="flex items-center gap-2">
      <mat-icon class="text-amber-500">warning</mat-icon>
      Refeições sem Vínculo
    </h2>

    <!-- Loading Indicator -->
    <mat-progress-bar
      *ngIf="isLoading"
      mode="indeterminate"
      class="mb-[-4px]"
    ></mat-progress-bar>

    <mat-dialog-content class="mat-typography max-h-[80vh]">
      <div class="mt-4 mb-6 text-neutral-600 text-sm">
        <p class="mb-2">
          Existem refeições sem vínculo com nenhum funcionário. Para
          regularizar:
        </p>
        <ul class="list-disc pl-5 space-y-1">
          <li>Cadastre os funcionários com as matrículas correspondentes;</li>
          <li>
            Ou <strong>ignore</strong> as refeições para não exportar para a
            folha (ícone de olho);
          </li>
          <li>Ou <strong>exclua</strong> os registros definitivamente.</li>
        </ul>
        <p
          class="mt-3 text-xs text-neutral-500 bg-blue-50 p-2 rounded border border-blue-100"
        >
          <mat-icon class="icon-xs align-middle text-blue-500 mr-1"
            >info</mat-icon
          >
          <strong>Nota:</strong> Refeições ignoradas são mantidas no sistema mas
          não aparecem na exportação da folha.
        </p>
      </div>

      <div class="border rounded-lg overflow-hidden relative min-h-[100px]">
        <table mat-table [dataSource]="groupedDataSource" class="w-full">
          <!-- Matricula -->
          <ng-container matColumnDef="matricula">
            <th mat-header-cell *matHeaderCellDef>Matrícula</th>
            <td mat-cell *matCellDef="let item">
              <span
                class="font-mono bg-amber-100 text-amber-800 p-1 rounded font-bold text-xs"
              >
                {{ item.matricula }}
              </span>
            </td>
          </ng-container>

          <!-- Nome no Funcionário -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Funcionário (Importado)</th>
            <td mat-cell *matCellDef="let item" class="text-neutral-700">
              {{ item.originalName }}
              <span
                *ngIf="item.ignoredInExport"
                class="ml-2 text-xs text-neutral-400 italic"
                >(Ignorado)</span
              >
            </td>
          </ng-container>

          <!-- Qtd -->
          <ng-container matColumnDef="count">
            <th mat-header-cell *matHeaderCellDef>Qtd.</th>
            <td mat-cell *matCellDef="let item" class="font-medium text-center">
              {{ item.count }}
            </td>
          </ng-container>

          <!-- Actions -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="text-right pr-6">
              Ações
            </th>
            <td mat-cell *matCellDef="let item" class="text-right">
              <!-- Register User -->
              <a
                mat-icon-button
                color="primary"
                [routerLink]="['/employees/new']"
                [queryParams]="{
                  matricula: item.matricula,
                  name: item.originalName
                }"
                (click)="close()"
                matTooltip="Cadastrar Funcionário"
              >
                <mat-icon>person_add</mat-icon>
              </a>

              <!-- Toggle Ignore -->
              <button
                mat-icon-button
                [color]="item.ignoredInExport ? 'warn' : 'accent'"
                (click)="toggleIgnore(item)"
                [matTooltip]="
                  item.ignoredInExport
                    ? 'Reativar para exportação'
                    : 'Ignorar na exportação'
                "
              >
                <mat-icon>{{
                  item.ignoredInExport ? 'visibility_off' : 'visibility'
                }}</mat-icon>
              </button>

              <!-- Delete -->
              <button
                mat-icon-button
                color="warn"
                matTooltip="Excluir definitivamente"
                (click)="deleteGroup(item)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr
            mat-header-row
            *matHeaderRowDef="displayedColumns; sticky: true"
            class="bg-gray-50"
          ></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            class="hover:bg-gray-50 transition-colors"
            [class.opacity-50]="row.ignoredInExport"
            [class.grayscale]="row.ignoredInExport"
          ></tr>
        </table>

        <!-- Empty State inside container -->
        <div
          *ngIf="!isLoading && groupedDataSource.length === 0"
          class="p-8 text-center"
        >
          <mat-icon class="text-5xl text-green-200 mb-2">check_circle</mat-icon>
          <p class="text-neutral-500 font-medium">Tudo certo!</p>
          <p class="text-sm text-neutral-400">Nenhuma refeição pendente.</p>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="mr-4 mb-2">
      <button mat-button (click)="close()">Fechar</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      /* Custom scrollbar for dialog content */
      mat-dialog-content::-webkit-scrollbar {
        width: 8px;
      }
      mat-dialog-content::-webkit-scrollbar-thumb {
        background-color: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
    `,
  ],
})
export class UnlinkedMealsDialogComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<UnlinkedMealsDialogComponent>);
  private dialog = inject(MatDialog);
  private mealsService = inject(MealsService);
  private snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Erro ao carregar pendências.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  groupMealsByMatricula(meals: IMeal[]) {
    const groups: Record<
      string,
      {
        matricula: string;
        originalName: string;
        count: number;
        ignoredInExport: boolean;
      }
    > = {};

    meals.forEach((meal) => {
      const mat = meal.matriculaSnapshot || 'N/A';
      if (!groups[mat]) {
        groups[mat] = {
          matricula: mat,
          originalName: meal.employeeNameSnapshot || 'Desconhecido',
          count: 0,
          ignoredInExport: false,
        };
      }
      groups[mat].count++;
      // If any meal in group is ignored, consider the group ignored (since we batch update)
      if (meal.ignoredInExport) {
        groups[mat].ignoredInExport = true;
      }
    });

    return Object.values(groups);
  }

  deleteGroup(item: any) {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Excluir Registros',
        message: `Tem certeza que deseja EXCLUIR DEFINITIVAMENTE todas as ${item.count} refeições da matrícula ${item.matricula}? Esta ação não pode ser desfeita.`,
        confirmText: 'Excluir',
        color: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.isLoading = true;
        this.mealsService.deletePending(item.matricula).subscribe({
          next: () => {
            this.snackBar.open('Registros excluídos com sucesso.', 'OK', {
              duration: 3000,
            });
            this.loadPending();
          },
          error: (err) => {
            console.error(err);
            this.isLoading = false;
            this.snackBar.open('Erro ao excluir registros.', 'Fechar', {
              duration: 3000,
            });
          },
        });
      }
    });
  }

  toggleIgnore(item: any) {
    const newStatus = !item.ignoredInExport;
    this.isLoading = true;
    this.mealsService.toggleIgnorePending(item.matricula, newStatus).subscribe({
      next: () => {
        const msg = newStatus
          ? 'Registros ignorados na exportação.'
          : 'Registros reativados para exportação.';
        this.snackBar.open(msg, 'OK', { duration: 2000 });
        this.loadPending();
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.snackBar.open('Erro ao atualizar status.', 'Fechar', {
          duration: 3000,
        });
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}
