import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import {
  EmployeeImportService,
  IImportResult,
} from '../../../core/services/employee-import.service';
import { EmployeeImportTemplateService } from '../../../core/services/employee-import-template.service';

@Component({
  selector: 'app-employee-import-dialog',
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
      <h2 mat-dialog-title>Importar Funcionários</h2>
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

    <mat-dialog-content class="mat-typography min-w-[500px]">
      <!-- STEP 1: Upload -->
      <div
        *ngIf="!analysisResult"
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
          <div class="flex-1 bg-green-50 p-4 rounded border border-green-100">
            <div class="text-green-800 text-sm font-bold">Válidos</div>
            <div class="text-2xl text-green-600">
              {{ analysisResult.valid.length }}
            </div>
          </div>
          <div class="flex-1 bg-red-50 p-4 rounded border border-red-100">
            <div class="text-red-800 text-sm font-bold">Inválidos</div>
            <div class="text-2xl text-red-600">
              {{ analysisResult.invalid.length }}
            </div>
          </div>
        </div>

        <!-- Errors Table -->
        <div
          *ngIf="analysisResult.invalid.length > 0"
          class="max-h-40 overflow-auto border rounded mb-4"
        >
          <table class="w-full text-xs text-left">
            <thead class="bg-gray-50 text-gray-500 font-semibold">
              <tr>
                <th class="p-2">Dado</th>
                <th class="p-2">Erro</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let err of analysisResult.invalid" class="border-t">
                <td class="p-2 truncate max-w-[150px]">
                  {{
                    err.row.firstName ||
                      err.row.matricula ||
                      'Linha desconhecida'
                  }}
                </td>
                <td class="p-2 text-red-600">{{ err.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          class="text-sm text-neutral-500"
          *ngIf="analysisResult.valid.length > 0"
        >
          Pronto para importar {{ analysisResult.valid.length }} funcionários.
        </div>
        <div
          class="text-sm text-red-500 font-medium"
          *ngIf="analysisResult.valid.length === 0"
        >
          Nenhum registro válido encontrado para importação.
        </div>
      </div>

      <!-- STEP 3: Importing -->
      <div *ngIf="isImporting" class="py-6">
        <p class="text-center text-sm text-neutral-500 mb-2">
          Importando {{ analysisResult?.valid?.length }} registros...
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
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">
        {{ importComplete ? 'Fechar' : 'Cancelar' }}
      </button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="
          !analysisResult ||
          analysisResult.valid.length === 0 ||
          isImporting ||
          importComplete
        "
        (click)="confirmImport()"
        *ngIf="!importComplete"
      >
        Importar
      </button>
    </mat-dialog-actions>
  `,
})
export class EmployeeImportDialogComponent {
  private dialogRef = inject(MatDialogRef<EmployeeImportDialogComponent>);
  private importService = inject(EmployeeImportService);
  private templateService = inject(EmployeeImportTemplateService);
  private snackBar = inject(MatSnackBar);

  isAnalyzing = false;
  isImporting = false;
  importComplete = false;
  analysisResult: IImportResult | null = null;

  downloadTemplate(type: 'csv' | 'json') {
    this.templateService.downloadTemplate(type);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    this.isAnalyzing = true;
    this.analysisResult = null;

    this.importService
      .parseFile(file)
      .then((data) => {
        // Validate Batch
        this.importService.validateBatch(data).subscribe({
          next: (result) => {
            this.analysisResult = result;
            this.isAnalyzing = false;
          },
          error: (err) => {
            this.snackBar.open('Erro na validação: ' + err, 'Fechar', {
              duration: 5000,
              panelClass: ['bg-red-600', 'text-white'],
            });
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
    if (!this.analysisResult || this.analysisResult.valid.length === 0) return;

    this.isImporting = true;
    this.importService.importEmployees(this.analysisResult.valid).subscribe({
      next: (results) => {
        this.isImporting = false;
        this.importComplete = true;
      },
      error: (err) => {
        this.snackBar.open('Erro crítico na importação: ' + err, 'Fechar', {
          duration: 5000,
          panelClass: ['bg-red-600', 'text-white'],
        });
        this.isImporting = false;
      },
    });
  }

  close() {
    this.dialogRef.close(this.importComplete);
  }
}
