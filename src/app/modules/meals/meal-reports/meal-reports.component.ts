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
  templateUrl: './meal-reports.component.html',
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
