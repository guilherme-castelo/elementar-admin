import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MealsService } from '../../../core/services/meals.service';
import { MealImportTemplateService } from '../../../core/services/meal-import-template.service';

interface IAnalysisResult {
  summary: {
    total: number;
    valid: number;
    missingEmployee: number;
    invalid: number;
  };
  valid: any[];
  missingEmployee: any[];
  invalid: { row: any; reason: string }[];
}

@Component({
  selector: 'app-meal-import-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTableModule,
    MatMenuModule,
  ],
  template: `
    <div class="flex justify-between items-center pr-6 pl-0 pt-0">
      <h2 mat-dialog-title>Importar Refeições</h2>
      <!-- Template Download Menu -->
      <button mat-button [matMenuTriggerFor]="menu" class="text-neutral-500">
        <mat-icon>download</mat-icon> Baixar Modelos
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="downloadTemplate('csv')">
          <mat-icon>table_view</mat-icon> Modelo CSV
        </button>
        <button mat-menu-item (click)="downloadTemplate('json')">
          <mat-icon>code</mat-icon> Modelo JSON
        </button>
      </mat-menu>
    </div>

    <mat-dialog-content class="mat-typography min-w-[600px] max-h-[80vh]">
      <!-- STEP 1: Upload -->
      <div
        *ngIf="!analysisResult && !isAnalyzing"
        class="flex flex-col items-center justify-center p-8 border-2 border-dashed border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
        onclick="document.getElementById('fileInput').click()"
      >
        <mat-icon class="text-4xl text-neutral-400 w-12 h-12 mb-2"
          >cloud_upload</mat-icon
        >
        <p class="text-neutral-600 font-medium">
          Clique para selecionar um arquivo
        </p>
        <p class="text-xs text-neutral-400 mt-1">Suporta .CSV ou .JSON</p>
        <input
          type="file"
          id="fileInput"
          class="hidden"
          (change)="onFileSelected($event)"
          accept=".csv,.json"
        />
      </div>

      <!-- Loading Analysis -->
      <div *ngIf="isAnalyzing" class="py-6">
        <p class="text-center text-sm text-neutral-500 mb-2">
          Analisando arquivo...
        </p>
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <!-- STEP 2: Review -->
      <div *ngIf="analysisResult && !isImporting && !importComplete">
        <div class="flex gap-4 mb-4">
          <div
            class="flex-1 bg-green-50 p-4 rounded border border-green-100 text-center"
          >
            <div class="text-green-800 text-sm font-bold">Válidos</div>
            <div class="text-2xl text-green-600">
              {{ analysisResult.summary.valid }}
            </div>
          </div>
          <div
            class="flex-1 bg-amber-50 p-4 rounded border border-amber-100 text-center"
          >
            <div class="text-amber-800 text-sm font-bold">Sem Vínculo</div>
            <div class="text-2xl text-amber-600">
              {{ analysisResult.summary.missingEmployee }}
            </div>
          </div>
          <div
            class="flex-1 bg-red-50 p-4 rounded border border-red-100 text-center"
          >
            <div class="text-red-800 text-sm font-bold">Inválidos</div>
            <div class="text-2xl text-red-600">
              {{ analysisResult.summary.invalid }}
            </div>
          </div>
        </div>

        <!-- Warning Banner -->
        <div
          *ngIf="analysisResult.summary.missingEmployee > 0"
          class="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4"
        >
          <div class="flex">
            <div class="flex-shrink-0">
              <mat-icon class="text-amber-500">warning</mat-icon>
            </div>
            <div class="ml-3">
              <p class="text-sm text-amber-700">
                Existem {{ analysisResult.summary.missingEmployee }} registros
                associados a matrículas não cadastradas. Eles serão importados
                como "Pendentes" e você poderá vincular o funcionário depois.
              </p>
            </div>
          </div>
        </div>

        <!-- Errors Table -->
        <div
          *ngIf="analysisResult.invalid.length > 0"
          class="max-h-40 overflow-auto border rounded mb-4"
        >
          <h4
            class="px-4 py-2 bg-gray-50 text-xs font-bold text-gray-500 uppercase sticky top-0"
          >
            Erros de Validação
          </h4>
          <table class="w-full text-xs text-left">
            <thead class="bg-gray-50 text-gray-500 font-semibold hidden">
              <tr>
                <th class="p-2">Dado</th>
                <th class="p-2">Erro</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let err of analysisResult.invalid" class="border-t">
                <td class="p-2 truncate max-w-[150px] font-mono">
                  {{ err.row.matricula }} -
                  {{ err.row.date | date : 'shortDate' }}
                </td>
                <td class="p-2 text-red-600">{{ err.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- STEP 3: Importing -->
      <div *ngIf="isImporting" class="py-6">
        <p class="text-center text-sm text-neutral-500 mb-2">
          Importando registros...
        </p>
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <!-- STEP 4: Complete -->
      <div *ngIf="importComplete" class="py-6 text-center">
        <mat-icon class="text-5xl text-green-500 w-16 h-16 mb-2"
          >check_circle</mat-icon
        >
        <h3 class="text-lg font-bold text-gray-800">Sucesso!</h3>
        <p class="text-neutral-600">Importação finalizada.</p>
        <div
          *ngIf="importResults && importResults.length > 0"
          class="mt-4 text-xs text-gray-500"
        >
          Foram processados {{ importResults.length }} registros.
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="pr-6 pb-6">
      <button mat-button (click)="close()">
        {{ importComplete ? 'Fechar' : 'Cancelar' }}
      </button>

      <button
        mat-raised-button
        color="primary"
        [disabled]="
          !analysisResult ||
          (analysisResult.summary.valid === 0 &&
            analysisResult.summary.missingEmployee === 0) ||
          isImporting ||
          importComplete
        "
        (click)="confirmImport()"
        *ngIf="!importComplete"
      >
        <span *ngIf="(analysisResult?.summary?.missingEmployee ?? 0) > 0"
          >Importar
          {{
            analysisResult!.summary.valid +
              analysisResult!.summary.missingEmployee
          }}
          Registros</span
        >
        <span
          *ngIf="
            !analysisResult || analysisResult.summary.missingEmployee === 0
          "
          >Importar</span
        >
      </button>
    </mat-dialog-actions>
  `,
})
export class MealImportDialogComponent {
  private dialogRef = inject(MatDialogRef<MealImportDialogComponent>);
  private mealsService = inject(MealsService);
  private templateService = inject(MealImportTemplateService);
  private snackBar = inject(MatSnackBar);

  isAnalyzing = false;
  isImporting = false;
  importComplete = false;
  analysisResult: IAnalysisResult | null = null;
  importResults: any[] = [];

  downloadTemplate(type: 'csv' | 'json') {
    this.templateService.downloadTemplate(type);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isAnalyzing = true;
    this.analysisResult = null;

    this.mealsService
      .parseFile(file)
      .then((data) => {
        this.mealsService.analyzeBatch(data).subscribe({
          next: (result) => {
            this.analysisResult = result;
            this.isAnalyzing = false;
          },
          error: (err) => {
            console.error(err);
            this.snackBar.open(
              'Erro na análise: ' + (err.error?.message || err.message || err),
              'Fechar',
              { duration: 5000, panelClass: ['bg-red-600', 'text-white'] }
            );
            this.isAnalyzing = false;
          },
        });
      })
      .catch((err) => {
        this.snackBar.open('Erro: ' + err, 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
        });
        this.isAnalyzing = false;
      });
  }

  confirmImport() {
    if (!this.analysisResult) return;

    // Combine valid and missingEmployee lists for import
    // The backend `importBulk` handles both types (linked and orphan)
    const recordsToImport = [
      ...this.analysisResult.valid,
      ...this.analysisResult.missingEmployee,
    ];

    if (recordsToImport.length === 0) return;

    this.isImporting = true;
    this.mealsService.importBulk(recordsToImport).subscribe({
      next: (results) => {
        this.importResults = results;
        this.isImporting = false;
        this.importComplete = true;
      },
      error: (err) => {
        this.snackBar.open(
          'Erro crítico na importação: ' + err.message,
          'Fechar',
          {
            duration: 5000,
            panelClass: ['bg-red-600', 'text-white'],
          }
        );
        this.isImporting = false;
      },
    });
  }

  close() {
    this.dialogRef.close(this.importComplete);
  }
}
