import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { IMeal } from '../../../core/models/meal.model';
import { NgxEchartsModule } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import { MealsService } from '../../../core/services/meals.service';
import { ReportPeriodService } from '../../../core/services/report-period.service';
import { PrintService } from '../../../core/services/print.service';
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
    MatDialogModule,
    RouterModule,
    NgxEchartsModule,
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

  // Controls
  granularityControl = new FormControl<'daily' | 'weekly' | 'single-day'>(
    'daily'
  );
  specificDateControl = new FormControl(
    new Date(Date.now() - 24 * 60 * 60 * 1000)
  );
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
  dailyMeals: IMeal[] = [];
  pendingCount = 0;

  // Filtered rows for display
  filteredRows: any[] = [];
  chartOptions: EChartsOption = {};

  isExporting = false;

  ngOnInit() {
    this.generateYears();

    // Subscribe to control changes to trigger refresh or filter
    this.viewModeControl.valueChanges.subscribe(() => this.refresh());
    this.granularityControl.valueChanges.subscribe(() =>
      this.onGranularityChange()
    );
    this.filterControl.valueChanges.subscribe(() => this.applyFilter());
    this.monthControl.valueChanges.subscribe(() => this.refresh());
    this.yearControl.valueChanges.subscribe(() => this.refresh());
    this.specificDateControl.valueChanges.subscribe(() => this.refresh());

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

  onGranularityChange() {
    // We no longer need to force sector for weekly
    this.refresh();
  }

  previousMonth() {
    let m = this.monthControl.value!;
    let y = this.yearControl.value!;

    m--;
    if (m < 0) {
      m = 11;
      y--;
    }

    // Ensure year exists in options or add it?
    // Years array is generated based on current year +/- 2.
    // If we go beyond range, we should probably add it or regenerate?
    // For simplicity, let's assume we stay in range or just set the control.
    // MatSelect might show empty if value not in options.
    // Let's add the year if missing.
    if (!this.years.includes(y)) {
      this.years.push(y);
      this.years.sort((a, b) => a - b);
    }

    // Batch updates?
    // Setting value triggers refresh due to subscription
    // We should probably silence events or update carefully.
    // But since we navigate, refreshing is intended.
    // However, updating year then month might trigger double refresh.
    // Let's update controls without emitting event, then call refresh manually?
    // Or just let it happen. Double request is minor but not ideal.
    // Let's set values with emitEvent: false then refresh.

    this.yearControl.setValue(y, { emitEvent: false });
    this.monthControl.setValue(m, { emitEvent: false }); // Last one triggers? No, emitEvent: false.

    this.refresh();
  }

  nextMonth() {
    let m = this.monthControl.value!;
    let y = this.yearControl.value!;

    m++;
    if (m > 11) {
      m = 0;
      y++;
    }

    if (!this.years.includes(y)) {
      this.years.push(y);
      this.years.sort((a, b) => a - b);
    }

    this.yearControl.setValue(y, { emitEvent: false });
    this.monthControl.setValue(m, { emitEvent: false });

    this.refresh();
  }

  refresh() {
    const granularity = this.granularityControl.value || 'daily';

    if (granularity === 'single-day') {
      const date = this.specificDateControl.value || new Date();
      // Adjust to sending ISO string for the day
      const dateIso = date.toISOString();

      this.mealsService.getDailyMeals(dateIso).subscribe((meals) => {
        this.dailyMeals = meals;
        // Calculate simple summary for this day
        const totalValue = meals.length * 3.0; // Fixed price for now, should come from service/model if variable
        this.summary = {
          totalQty: meals.length,
          totalValue: totalValue,
        };
        this.applyFilter();
      });
      return;
    }

    const month = this.monthControl.value!;
    const year = this.yearControl.value!;
    const viewMode = this.viewModeControl.value || 'sector';

    // Using new service
    const { startIso, endIso, startStr, endStr } =
      this.reportPeriodService.getPeriodByMonth(month, year);
    this.periodStart = startIso;
    this.periodEnd = endIso;

    // Passing the Month Reference Date for dailyMatrix logic
    const refDate = new Date(year, month, 1);

    // Ensure we use the robust T23:59:59.999Z end date for filtering
    const apiEnd = endStr + 'T23:59:59.999Z';

    forkJoin({
      summary: this.mealsService.getWeeklySummary(startStr, apiEnd),
      matrix: this.mealsService.getWeeklyReport(startStr, apiEnd, viewMode),
      dailyMatrix: this.mealsService.getDailyReport(refDate, viewMode),
      pendingCount: this.mealsService.getPendingCount(month, year),
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
    const granularity = this.granularityControl.value;

    if (granularity === 'single-day') {
      if (!filter) {
        this.filteredRows = this.dailyMeals;
      } else {
        this.filteredRows = this.dailyMeals.filter((meal) => {
          const empName = (
            meal.employeeNameSnapshot ||
            meal.employee?.firstName ||
            ''
          ).toLowerCase();
          const sector = (
            meal.employeeSectorSnapshot ||
            meal.employee?.setor ||
            ''
          ).toLowerCase();
          return empName.includes(filter) || sector.includes(filter);
        });
      }
      // Sort by name
      this.filteredRows.sort((a, b) => {
        const nameA = a.employeeNameSnapshot || a.employee?.firstName || '';
        const nameB = b.employeeNameSnapshot || b.employee?.firstName || '';
        return nameA.localeCompare(nameB);
      });
      this.calculateTotals();
      return; // No chart update for list view yet? or maybe just counts
    }

    let sourceRows: any[] = [];
    if (granularity === 'weekly') sourceRows = this.matrix.rows;
    else sourceRows = this.dailyMatrix.rows;

    if (!sourceRows) {
      this.filteredRows = [];
      return;
    }

    if (!filter) {
      this.filteredRows = sourceRows;
    } else {
      this.filteredRows = sourceRows.filter((row: any) => {
        // Now all rows have 'label' and 'secondaryLabel' (except maybe legacy sector matrix if not fully aligned, but we fixed service)
        // Service now returns standardized { label, secondaryLabel } even for generic calls.

        // Wait, did I update getWeeklyReport to use new structure? YES.

        const labelMatch = (row.label || row.sector || '')
          .toLowerCase()
          .includes(filter); // row.sector as fallback
        const subLabelMatch = (row.secondaryLabel || '')
          .toLowerCase()
          .includes(filter);
        return labelMatch || subLabelMatch;
      });
    }

    this.calculateTotals();
    this.updateChart();
  }

  displayedWeeklyTotals: number[] = [];
  displayedDailyTotals: number[] = [];

  calculateTotals() {
    const granularity = this.granularityControl.value;
    const isSingleDay = granularity === 'single-day';
    const rows = this.filteredRows || [];

    if (isSingleDay) {
      // Single Day Logic (IMeal[])
      const totalQty = rows.length;
      // Assuming naive calculation or summing price if available.
      // Existing logic used fixed 3.0 in refresh(), let's stick to that or use row.price if consistent.
      // In HTML it uses row.price. Let's sum row.price.
      const totalValue = rows.reduce((acc, row) => acc + Number(row.price || 0),0);

      this.summary = { totalQty, totalValue };
      return;
    }

    // Matrix Logic
    let totalQty = 0;
    let totalValue = 0;

    // Initialize column totals
    const isWeekly = granularity === 'weekly';
    const numCols = isWeekly
      ? this.matrix?.weeks?.length || 0
      : this.dailyMatrix?.days?.length || 0;
    const colTotals = new Array(numCols).fill(0);

    rows.forEach((row: any) => {
      totalQty += row.totalQty || 0;
      totalValue += row.totalValue || 0;

      const counts = isWeekly ? row.weeklyCounts : row.dailyCounts;
      if (Array.isArray(counts)) {
        counts.forEach((c: number, i: number) => {
          if (i < numCols) {
            colTotals[i] += c;
          }
        });
      }
    });

    this.summary = { totalQty, totalValue };

    if (isWeekly) {
      this.displayedWeeklyTotals = colTotals;
    } else {
      this.displayedDailyTotals = colTotals;
    }
  }

  updateChart() {
    console.log(this.granularityControl.value);

    const granularity = this.granularityControl.value;
    const isDaily = granularity === 'daily';
    const rows = this.filteredRows || [];

    // 1. Prepare X-Axis
    let xAxisData: string[] = [];
    if (isDaily) {
      xAxisData = this.dailyMatrix.days.map((d: any) => d.label);
    } else {
      xAxisData = this.matrix.weeks.map((w: any) => w.label);
    }

    // 2. Prepare Series
    const series: any[] = rows.map((row) => {
      const data = isDaily ? row.dailyCounts : row.weeklyCounts;
      return {
        name: row.label,
        type: 'line',
        smooth: true,
        data: data,
        showSymbol: false,
      };
    });

    this.chartOptions = {
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: rows.map((r) => r.label),
        bottom: 0,
        type: 'scroll',
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
      },
      yAxis: {
        type: 'value',
        name: 'Refeições',
        interval: 1,
      },
      series: series.length ? series : [],
    };
  }

  openUnlinkedDialog() {
    this.dialog.open(UnlinkedMealsDialogComponent, {
      width: '900px',
      disableClose: false,
      data: {
        month: this.monthControl.value,
        year: this.yearControl.value,
      },
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

  // --- Print Logic ---
  private printService = inject(PrintService);

  // Shortcut Listener
  @HostListener('window:keydown.control.p', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    event.preventDefault();
    this.onPrint();
  }

  onPrint() {
    // Check which tab is active (0 = Weekly Summary, 1 = Daily Report)
    // We can infer logic from available data or user selection if we track tab index
    // For now, let's assume we want to print what is visible.
    // MatTabGroup API is needed to check selectedIndex if we want automatic detection.
    // Simpler: Just print the current view context.

    // However, I need to know which dataset to send.
    // Let's rely on a view state property.
    // Since I don't track selectedTab explicitly in a variable, I will add it or guess based on viewMode.
    // Actually, matrix vs dailyMatrix depends on the visual tab.
    // Let's add a variable `selectedTabIndex` binding to the tab group.

    // Defaulting to print logic:
    // Defaulting to print logic:
    const granularity = this.granularityControl.value;
    const isWeekly = granularity === 'weekly';
    const isSingleDay = granularity === 'single-day';

    let printPayload: any = {};

    if (isSingleDay) {
      printPayload = {
        type: 'daily-list',
        companyName: 'Brasil Super Atacado',
        title: `Relatório do Dia ${this.specificDateControl.value?.toLocaleDateString('pt-BR')}`,
        periodStart: this.specificDateControl.value?.toISOString(),
        periodEnd: this.specificDateControl.value?.toISOString(), // Same day
        summary: this.summary,
        rows: this.filteredRows, // The list of meals
      };
    } else {
      printPayload = {
        type: isWeekly ? 'weekly' : 'daily',
        companyName: 'Brasil Super Atacado', // TODO: Get from CompanyService
        title: isWeekly
          ? 'Relatório Semanal de Custos'
          : 'Relatório Diário de Refeições',
        periodStart: this.periodStart,
        periodEnd: this.periodEnd,
        summary: this.summary,

        // Weekly Data
        matrix: this.matrix,

        // Daily Data
        dailyMatrix: this.dailyMatrix,
        rows: this.filteredRows, // Respect filters
        viewMode: this.viewModeControl.value,
      };
    }

    this.printService.setPrintData(printPayload);

    // Open in new tab
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/print/report'])
    );
    window.open(url, '_blank');
  }

  // selectedTabIndex = 0; // Removed as we use unified view
  // onTabChange(event: MatTabChangeEvent) {
  //   this.selectedTabIndex = event.index;
  // }
}
