import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MealsService } from '../../../core/services/meals.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { forkJoin } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { environment } from '../../../../environments/environment';
import { PermissionService } from '../../../core/services/permission.service';
import { UnlinkedMealsDialogComponent } from '../unlinked-meals-dialog/unlinked-meals-dialog.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-meal-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatTableModule,
    MatSelectModule,
    MatButtonToggleModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterModule,
  ],
  template: `
    <div class="p-6">
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"
      >
        <div>
          <h1 class="text-2xl font-bold dark:text-gray-100">
            Relatórios de Refeições
          </h1>
          <p class="text-neutral-500 dark:text-neutral-400">
            Gestão de custos e consumo por setor
          </p>
        </div>

        <!-- Month/Year Filter -->
        <div
          class="flex gap-3 bg-white dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm"
        >
          <mat-form-field appearance="outline" class="w-40 hide-subscript">
            <mat-label>Mês</mat-label>
            <mat-select
              [formControl]="monthControl"
              (selectionChange)="onMonthYearChange()"
            >
              <mat-option *ngFor="let m of months; let i = index" [value]="i">{{
                m
              }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-32 hide-subscript">
            <mat-label>Ano</mat-label>
            <mat-select
              [formControl]="yearControl"
              (selectionChange)="onMonthYearChange()"
            >
              <mat-option *ngFor="let y of years" [value]="y">{{
                y
              }}</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-stroked-button
            color="primary"
            matTooltip="Exportar para Domínio"
            (click)="exportToDominio()"
            [disabled]="isExporting"
          >
            <mat-icon>file_download</mat-icon> Exportar
          </button>

          <button
            mat-stroked-button
            color="primary"
            class="bg-blue-600 text-white border-blue-600"
            (click)="navigateToRegister()"
            *ngIf="permissionService.hasPermission('meal:create')"
            matTooltip="Registrar Nova Refeição"
          >
            <mat-icon>add_circle</mat-icon> Registrar
          </button>
        </div>
      </div>

      <div class="mb-4 text-right text-sm text-neutral-500 font-medium">
        <span
          class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100"
        >
          Período: {{ periodStart | date : 'dd/MM/yyyy' }} a
          {{ periodEnd | date : 'dd/MM/yyyy' }}
        </span>
      </div>

      <!-- Pending Meals Banner -->
      <div
        *ngIf="pendingCount > 0"
        class="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded shadow-sm flex justify-between items-center"
      >
        <div class="flex items-center gap-3">
          <mat-icon class="text-amber-600">warning</mat-icon>
          <div>
            <h3 class="font-bold text-amber-800 m-0">
              Atenção: Registros Pendentes
            </h3>
            <p class="text-sm text-amber-700 m-0">
              Existem {{ pendingCount }} refeições importadas sem vínculo com
              funcionário.
            </p>
          </div>
        </div>
        <button mat-stroked-button color="warn" (click)="openUnlinkedDialog()">
          Visualizar Pendências
        </button>
      </div>

      <div
        class="p-4 rounded-lg shadow-sm border border-neutral-200 dark:border-gray-700 overflow-hidden"
      >
        <mat-tab-group animationDuration="0ms">
          <!-- Summary Tab -->
          <mat-tab label="Resumo Financeiro">
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div
                  class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-100 dark:border-blue-900/30"
                >
                  <div
                    class="text-blue-600 dark:text-blue-400 font-medium mb-1"
                  >
                    Total Refeições
                  </div>
                  <div
                    class="text-3xl font-bold text-blue-800 dark:text-blue-300"
                  >
                    {{ summary?.totalQty || 0 }}
                  </div>
                </div>
                <div
                  class="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-100 dark:border-green-900/30"
                >
                  <div
                    class="text-green-600 dark:text-green-400 font-medium mb-1"
                  >
                    Custo Total (R$)
                  </div>
                  <div
                    class="text-3xl font-bold text-green-800 dark:text-green-300"
                  >
                    {{ summary?.totalValue || 0 | currency : 'BRL' }}
                  </div>
                </div>
              </div>

              <h3
                class="font-bold text-lg mb-4 text-neutral-700 dark:text-neutral-300"
              >
                Detalhamento por Setor (Semanas)
              </h3>

              <div class="overflow-x-auto">
                <table
                  class="w-full text-sm text-left text-neutral-600 dark:text-neutral-300"
                >
                  <thead
                    class="text-xs text-neutral-700 dark:text-neutral-200 uppercase bg-gray-50 dark:bg-gray-700"
                  >
                    <tr>
                      <th class="px-4 py-3 border-b dark:border-gray-600">
                        Setor
                      </th>
                      <!-- Dynamic Weeks Headers -->
                      <th
                        *ngFor="let week of matrix?.weeks"
                        class="px-4 py-3 border-b dark:border-gray-600 text-center"
                      >
                        {{ week.label }}<br />
                        <span class="text-[10px] lowercase font-normal"
                          >{{ week.start | date : 'dd/MM/yyyy' }} -
                          {{ week.end | date : 'dd/MM/yyyy' }}</span
                        >
                      </th>
                      <th
                        class="px-4 py-3 border-b dark:border-gray-600 text-right"
                      >
                        Total Mês
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let row of matrix?.rows"
                      class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td
                        class="px-4 py-3 font-medium text-gray-900 dark:text-gray-100"
                      >
                        {{ row.sector }}
                      </td>

                      <!-- Weekly Counts -->
                      <td
                        *ngFor="let count of row.weeklyCounts; let i = index"
                        class="px-4 py-3 text-center"
                      >
                        <div class="flex flex-col items-center">
                          <span
                            *ngIf="count > 0"
                            class="font-semibold text-gray-900 dark:text-white"
                            >{{ count }}</span
                          >
                          <span
                            *ngIf="count > 0"
                            class="text-xs text-gray-500 dark:text-gray-400"
                            >{{ row.weeklyValues[i] | currency : 'BRL' }}</span
                          >
                          <span
                            *ngIf="count === 0"
                            class="text-neutral-300 dark:text-neutral-600"
                            >-</span
                          >
                        </div>
                      </td>

                      <td
                        class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white"
                      >
                        <div>{{ row.totalQty }}</div>
                        <div class="text-xs text-green-600 dark:text-green-400">
                          {{ row.totalValue | currency : 'BRL' }}
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="!matrix?.rows?.length">
                      <td
                        [attr.colspan]="(matrix?.weeks?.length || 0) + 2"
                        class="text-center py-8"
                      >
                        Nenhum dado encontrado neste período.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>

          <!-- Daily Report Tab -->
          <mat-tab label="Relatório Diário">
            <div class="p-6">
              <!-- Filters & View Mode -->
              <div
                class="flex flex-col md:flex-row justify-between items-end gap-4 mb-6"
              >
                <div class="flex gap-4 items-center">
                  <mat-button-toggle-group
                    [formControl]="viewModeControl"
                    aria-label="Modo de Visualização"
                    class="h-12"
                  >
                    <mat-button-toggle value="sector"
                      >Por Setor</mat-button-toggle
                    >
                    <mat-button-toggle value="employee"
                      >Por Funcionário</mat-button-toggle
                    >
                  </mat-button-toggle-group>
                </div>

                <mat-form-field
                  appearance="outline"
                  class="w-full md:w-80 hide-subscript"
                >
                  <mat-label
                    >Filtrar por
                    {{
                      viewModeControl.value === 'sector'
                        ? 'Setor'
                        : 'Funcionário'
                    }}</mat-label
                  >
                  <input
                    matInput
                    [formControl]="filterControl"
                    placeholder="Digite para buscar..."
                  />
                  <mat-icon matSuffix>search</mat-icon>
                </mat-form-field>
              </div>

              <!-- Legend info -->
              <div class="mb-4 flex gap-4 text-xs text-neutral-500">
                <span>* Exibindo apenas dias úteis (Segunda a Sábado)</span>
                <span>* Feriados não são excluídos automaticamente</span>
              </div>

              <div class="overflow-x-auto max-w-full">
                <table
                  class="min-w-max w-full text-sm text-center text-neutral-600 dark:text-neutral-300 border-collapse"
                >
                  <thead
                    class="text-xs text-neutral-700 dark:text-neutral-200 uppercase bg-gray-50 dark:bg-gray-700 sticky top-0 z-10"
                  >
                    <tr>
                      <th
                        class="px-3 py-3 border-b dark:border-gray-600 text-left sticky left-0 bg-gray-50 dark:bg-gray-700 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        {{
                          viewModeControl.value === 'sector'
                            ? 'Setor'
                            : 'Funcionário'
                        }}
                      </th>
                      <!-- Dynamic Days Headers -->
                      <th
                        *ngFor="let day of dailyMatrix?.days"
                        class="px-2 py-3 border-b dark:border-gray-600 min-w-[50px]"
                      >
                        {{ day.label }}
                      </th>
                      <th
                        class="px-3 py-3 border-b dark:border-gray-600 text-right sticky right-0 bg-gray-50 dark:bg-gray-700 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      *ngFor="let row of filteredRows"
                      class="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td
                        class="px-3 py-2 font-medium text-gray-900 dark:text-gray-100 text-left sticky left-0 bg-white dark:bg-gray-800 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        <div>{{ row.label }}</div>
                        <div
                          *ngIf="row.secondaryLabel"
                          class="text-[10px] text-neutral-400 font-normal"
                        >
                          Mat: {{ row.secondaryLabel }}
                        </div>
                      </td>

                      <!-- Daily Counts -->
                      <td
                        *ngFor="let count of row.dailyCounts"
                        class="px-2 py-2 border-l border-neutral-100 dark:border-neutral-700"
                      >
                        <span
                          *ngIf="count > 0"
                          class="font-semibold text-gray-900 dark:text-white"
                          >{{ count }}</span
                        >
                        <span
                          *ngIf="count === 0"
                          class="text-neutral-300 dark:text-neutral-700"
                          >-</span
                        >
                      </td>

                      <td
                        class="px-3 py-2 text-right font-bold text-gray-900 dark:text-white sticky right-0 bg-white dark:bg-gray-800 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        {{ row.totalQty }}
                      </td>
                    </tr>

                    <!-- Totals Footer -->
                    <tr
                      *ngIf="dailyMatrix?.rows?.length"
                      class="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-neutral-300 dark:border-neutral-600"
                    >
                      <td
                        class="px-3 py-2 text-left sticky left-0 bg-gray-100 dark:bg-gray-900 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        TOTAL
                      </td>
                      <td
                        *ngFor="let total of dailyMatrix?.dailyTotals"
                        class="px-2 py-2"
                      >
                        {{ total > 0 ? total : '-' }}
                      </td>
                      <td
                        class="px-3 py-2 text-right sticky right-0 bg-gray-100 dark:bg-gray-900 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                      >
                        {{ summary?.totalQty }}
                      </td>
                    </tr>

                    <tr *ngIf="!filteredRows?.length">
                      <td
                        [attr.colspan]="(dailyMatrix?.days?.length || 0) + 2"
                        class="text-center py-8"
                      >
                        Nenhum dado encontrado neste período.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
    </div>
  `,
  styles: [
    `
      .hide-subscript ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }
      /* Remove focus outline from mat-button-toggle-group */
      .mat-button-toggle-group.mat-mdc-button-toggle-group {
        outline: none;
      }
      .mat-button-toggle-group.mat-mdc-button-toggle-group
        .mat-mdc-button-toggle {
        outline: none;
      }
    `,
  ],
})
export class MealReportsComponent implements OnInit {
  private mealsService = inject(MealsService);
  private reportPeriodService = inject(ReportPeriodService);
  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  public permissionService = inject(PermissionService);
  private router = inject(Router);
  private baseUrl = environment.apiBaseUrl || '/api';

  // Initialize with current BILLING period (26th rule)
  private currentPeriod = this.reportPeriodService.getCurrentBillingMonthYear();

  monthControl = new FormControl(this.currentPeriod.month);
  yearControl = new FormControl(this.currentPeriod.year);

  // New Controls
  viewModeControl = new FormControl<'sector' | 'employee'>('sector');
  filterControl = new FormControl('');

  months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  years: number[] = [];

  periodStart = '';
  periodEnd = '';

  summary: any = {};
  matrix: any = { weeks: [], rows: [] };
  dailyMatrix: any = { days: [], rows: [] };
  pendingCount = 0;

  // Filtered rows for display
  filteredRows: any[] = [];

  isExporting = false;

  ngOnInit() {
    this.generateYears();

    // Subscribe to control changes to trigger refresh or filter
    this.viewModeControl.valueChanges.subscribe(() => this.refresh());
    this.filterControl.valueChanges.subscribe(() => this.applyFilter());

    this.refresh();
  }

  generateYears() {
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      this.years.push(i);
    }
  }

  onMonthYearChange() {
    this.refresh();
  }

  refresh() {
    const month = this.monthControl.value!;
    const year = this.yearControl.value!;
    const viewMode = this.viewModeControl.value || 'sector';

    // Using new service
    const { startIso, endIso } = this.reportPeriodService.getPeriodByMonth(
      month,
      year
    );
    this.periodStart = startIso;
    this.periodEnd = endIso;

    // Passing the Month Reference Date for dailyMatrix logic
    const refDate = new Date(year, month, 1);

    forkJoin({
      summary: this.mealsService.getWeeklySummary(startIso, endIso),
      matrix: this.mealsService.getSectorWeeklyMatrix(startIso, endIso),
      dailyMatrix: this.mealsService.getDailyReport(refDate, viewMode),
      pendingCount: this.mealsService.getPendingCount(),
    }).subscribe((data) => {
      this.summary = data.summary;
      this.matrix = data.matrix;
      this.dailyMatrix = data.dailyMatrix;
      this.pendingCount = data.pendingCount;
      this.applyFilter();
    });
  }

  applyFilter() {
    const filter = (this.filterControl.value || '').toLowerCase().trim();
    if (!this.dailyMatrix?.rows) {
      this.filteredRows = [];
      return;
    }

    if (!filter) {
      this.filteredRows = this.dailyMatrix.rows;
    } else {
      this.filteredRows = this.dailyMatrix.rows.filter((row: any) => {
        const labelMatch = (row.label || '').toLowerCase().includes(filter);
        const subLabelMatch = (row.secondaryLabel || '')
          .toLowerCase()
          .includes(filter);
        return labelMatch || subLabelMatch;
      });
    }
  }

  openUnlinkedDialog() {
    this.dialog.open(UnlinkedMealsDialogComponent, {
      width: '900px',
      disableClose: false,
    });
  }

  exportToDominio() {
    this.isExporting = true;
    const month = this.monthControl.value! + 1; // 0-indexed to 1-indexed
    const year = this.yearControl.value!;

    const params = new HttpParams().set('month', month).set('year', year);

    this.http
      .get(`${this.baseUrl}/integrations/dominio/export`, {
        params,
        responseType: 'text',
      })
      .subscribe({
        next: (data: any) => {
          this.downloadFile(
            data,
            `dominio_${year}_${String(month).padStart(2, '0')}.txt`
          );
          this.isExporting = false;
          this.snackBar.open('Arquivo gerado com sucesso!', 'OK', {
            duration: 3000,
          });
        },
        error: (err: any) => {
          console.error(err);
          let msg = 'Erro ao gerar arquivo.';

          if (err.status === 404) {
            msg = 'Não há registros para o período.';
          } else if (err.error) {
            try {
              // Since responseType is 'text', err.error is likely a JSON string
              const body =
                typeof err.error === 'string'
                  ? JSON.parse(err.error)
                  : err.error;
              if (body && body.message) {
                msg = body.message;
              }
            } catch (e) {
              // If parsing fails, stick to default or try raw text
              if (typeof err.error === 'string') msg = err.error;
            }
          }

          this.snackBar.open(msg, 'Fechar', { duration: 5000 });
          this.isExporting = false;
        },
      });
  }

  private downloadFile(data: string, filename: string) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  navigateToRegister() {
    this.router.navigate(['/meals/register']);
  }
}
