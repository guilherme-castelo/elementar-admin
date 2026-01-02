import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { IMeal } from '../models/meal.model';
import { Observable, map, of } from 'rxjs';
import { IEmployee } from '../models/employee.model';
import { ReportPeriodService } from './report-period.service';

@Injectable({
  providedIn: 'root',
})
export class MealsService {
  private api = inject(ApiService);

  parseFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const text = e.target.result;
        try {
          if (file.name.endsWith('.json')) {
            resolve(this.parseJson(text));
          } else if (file.name.endsWith('.csv')) {
            resolve(this.parseCsv(text));
          } else {
            reject('Formato de arquivo não suportado. Use .csv ou .json');
          }
        } catch (err) {
          reject('Erro ao ler arquivo: ' + err);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  }

  private parseJson(text: string): any[] {
    const data = JSON.parse(text);
    if (Array.isArray(data)) return data;
    if (data.meals && Array.isArray(data.meals)) return data.meals; // Support wrapped
    throw new Error('Formato JSON inválido. Esperado array.');
  }

  private parseCsv(text: string): any[] {
    const lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== '');
    if (lines.length < 2) return [];

    const headers = lines[0]
      .split(',')
      .map((h) => h.trim().replace(/^"|"$/g, ''));
    const results = [];

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(',');
      if (currentLine.length === headers.length) {
        const obj: any = {};
        for (let j = 0; j < headers.length; j++) {
          let val = currentLine[j].trim().replace(/^"|"$/g, '');
          obj[headers[j]] = val;
        }
        results.push(obj);
      }
    }
    return results;
  }
  private authService = inject(AuthService);
  private reportPeriodService = inject(ReportPeriodService);

  private readonly MEAL_PRICE = 3.0;

  analyzeBatch(data: any[]): Observable<any> {
    return this.api.post('/meals/analyze', data);
  }

  importBulk(records: any[]): Observable<any> {
    return this.api.post('/meals/import', { records });
  }

  getPendingCount(): Observable<number> {
    return this.api
      .get<{ count: number }>('/meals/pending-count')
      .pipe(map((res) => res.count));
  }

  getPendingMeals(): Observable<IMeal[]> {
    return this.api.get<IMeal[]>('/meals/pending');
  }

  /**
   * Calculates the billing period for a given date.
   * Delegates to ReportPeriodService based on the month of the provided date.
   * Ideally, callers should use ReportPeriodService directly, but kept for compatibility.
   */
  getPeriod(date: Date): { start: string; end: string } {
    // Determine target month based on date.
    // If day >= 26, it belongs to NEXT month's period? No.
    // The previous logic was:
    // If >= 26: Start 26th Current, End 25th Next. (This means it belongs to NEXT month period).
    // If < 26: Start 26th Previous, End 25th Current. (This means it belongs to CURRENT month period).

    // Let's align with "Reference Month".
    // If today is Dec 27, it belongs to Jan Period (Dec 26 - Jan 25).
    // If today is Dec 20, it belongs to Dec Period (Nov 26 - Dec 25).

    let targetMonth = date.getMonth();
    let targetYear = date.getFullYear();

    if (date.getDate() >= 26) {
      targetMonth++;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear++;
      }
    }

    const { startIso, endIso } = this.reportPeriodService.getPeriodByMonth(
      targetMonth,
      targetYear
    );
    return { start: startIso, end: endIso };
  }

  /**
   * Register a new meal for an employee.
   * Checks for duplicates for the same day/employee handled by backend or UI logic (here we assume backend is dumb JSON-SERVER, so we could check, but UI feedback is better).
   */
  registerTx(dateIso: string, employee: IEmployee): Observable<IMeal> {
    const dateObj = new Date(dateIso);
    const { start, end } = this.getPeriod(dateObj);
    const currentUser = this.authService.getUser();

    const meal: Partial<IMeal> = {
      employeeId: Number(employee.id),
      // employeeMatricula: employee.matricula, // Not needed for persistence if backend snapshots
      // Backend expects these for snapshotting if it doesn't do it itself (but our backend service DOES do it).
      // However, to be safe or explicit:
      employeeNameSnapshot: `${employee.firstName} ${employee.lastName}`,
      employeeSectorSnapshot: employee.setor,

      companyId: Number(currentUser?.companyId || employee.companyId || 1),
      date: dateIso,
      price: this.MEAL_PRICE,
      periodStart: start,
      periodEnd: end,
      // createdAt: new Date().toISOString() // Backend sets this
    };

    return this.api.post<IMeal>('/meals', meal);
  }

  delete(id: number | string): Observable<void> {
    return this.api.delete<void>(`/meals/${id}`);
  }

  deletePending(matricula: string): Observable<void> {
    return this.api.delete<void>(`/meals/pending/${matricula}`);
  }

  toggleIgnorePending(matricula: string, ignore: boolean): Observable<void> {
    return this.api.patch<void>(`/meals/pending/${matricula}/ignore`, {
      ignore,
    });
  }

  getDailyMeals(dateIso: string): Observable<IMeal[]> {
    // Ensuring basic filter by date.
    // In production this should also filter by companyId.
    const user = this.authService.getUser();
    const companyQuery = user?.companyId ? `companyId=${user.companyId}&` : '';

    return user
      ? this.api.get<IMeal[]>(
          `/meals?${companyQuery}date=${dateIso.split('T')[0]}`
        )
      : of([]);
  }

  getMealsByPeriod(
    periodStart: string,
    periodEnd: string
  ): Observable<IMeal[]> {
    const user = this.authService.getUser();
    const companyQuery = user?.companyId ? `companyId=${user.companyId}&` : '';
    // Fetching by period logic on JSON-SERVER is tricky without range operators (gte, lte).
    // JSON-SERVER supports `key_gte` and `key_lte`.
    // Since we store periodStart/End on the record, we can filter by that specific period "bucket" if we want exact billing cycle match.
    // Or we filter by `date` range.
    // Storing `periodStart` allows us to just Get `?periodStart=X&periodEnd=Y` which aggregates perfectly.
    return this.api.get<IMeal[]>(
      `/meals?${companyQuery}periodStart=${periodStart}&periodEnd=${periodEnd}`
    );
  }

  getMealsInDateRange(startDate: string, endDate: string): Observable<IMeal[]> {
    const user = this.authService.getUser();
    const companyQuery = user?.companyId ? `companyId=${user.companyId}&` : '';
    // Basic date range filter for JSON Server
    // Ensure we are comparing 'YYYY-MM-DD' strings if stored that way, or ISO strings.
    // The previous implementation used split('T')[0] for storage.
    // Let's assume strict string comparison on the date field.
    return this.api.get<IMeal[]>(
      `/meals?${companyQuery}date_gte=${startDate}&date_lte=${endDate}`
    );
  }

  getWeeklySummary(start: string, end: string): Observable<any> {
    return this.getMealsByPeriod(start, end).pipe(
      map((meals) => {
        const totalQty = meals.length;
        const totalValue = totalQty * this.MEAL_PRICE;
        return { totalQty, totalValue };
      })
    );
  }

  /**
   * Generates a matrix of Sector x Days (Mon-Sat).
   */
  /**
   * Generates a matrix of Group (Sector/Employee) x Days (Mon-Sat).
   */
  getDailyReport(
    date: Date,
    groupBy: 'sector' | 'employee' = 'sector'
  ): Observable<any> {
    const { start, end } = this.getPeriod(date);
    return this.getMealsByPeriod(start, end).pipe(
      map((meals) => {
        const startDate = new Date(start);
        const endDate = new Date(end);

        // 1. Generate buckets (Days)
        const days: { label: string; id: string; fullDate: Date }[] = [];
        let cursor = new Date(startDate);

        while (cursor <= endDate) {
          const dayOfWeek = cursor.getDay();
          // 0 = Sun, 6 = Sat. Include 1..6 (Mon-Sat)
          if (dayOfWeek !== 0) {
            days.push({
              label: `${cursor.getDate().toString().padStart(2, '0')}/${(
                cursor.getMonth() + 1
              )
                .toString()
                .padStart(2, '0')}`,
              id: cursor.toISOString().split('T')[0], // YYYY-MM-DD
              fullDate: new Date(cursor),
            });
          }
          cursor.setDate(cursor.getDate() + 1);
        }

        // 2. Generate Matrix
        const { rows, totals } = this.generateMatrix({
          meals,
          buckets: days,
          bucketMatcher: (meal, bucket) =>
            meal.date.split('T')[0] === bucket.id,
          groupBy,
        });

        // 3. Adapter for Daily View (specific return format if needed, or just return rows)
        // The UI expects { days, rows, dailyTotals }
        return { days, rows, dailyTotals: totals };
      })
    );
  }

  // Deprecated: kept for backward compatibility if needed, or alias to new method
  getDailySectorMatrixByMonth(date: Date): Observable<any> {
    return this.getDailyReport(date, 'sector');
  }

  /**
   * Generates a matrix of Group (Sector/Employee) x Weeks.
   */
  getWeeklyReport(
    start: string,
    end: string,
    groupBy: 'sector' | 'employee' = 'sector'
  ): Observable<any> {
    return this.getMealsByPeriod(start, end).pipe(
      map((meals) => {
        // 1. Identify weeks
        const weeks: { label: string; start: Date; end: Date; id: string }[] =
          [];
        let cursor = new Date(start);
        const endDate = new Date(end);
        let weekIndex = 1;

        while (cursor <= endDate) {
          let nextSat = new Date(cursor);
          const day = nextSat.getDay();
          const dist = 6 - day + (day === 0 ? -6 : 0);
          if (day === 0) {
            cursor.setDate(cursor.getDate() + 1);
            continue;
          }

          nextSat.setDate(nextSat.getDate() + dist);
          let weekEnd = nextSat > endDate ? new Date(endDate) : nextSat;

          weeks.push({
            label: `Semana ${weekIndex}`,
            id: `w${weekIndex}`,
            start: new Date(cursor),
            end: weekEnd,
          });

          cursor = new Date(weekEnd);
          cursor.setDate(cursor.getDate() + 1);
          if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() + 1);
          weekIndex++;
        }

        // 2. Generate Matrix
        const { rows } = this.generateMatrix({
          meals,
          buckets: weeks,
          bucketMatcher: (meal, bucket) => {
            const mDateIso = meal.date.split('T')[0];
            const wkStartIso = bucket.start.toISOString().split('T')[0];
            const wkEndIso = bucket.end.toISOString().split('T')[0];
            return mDateIso >= wkStartIso && mDateIso <= wkEndIso;
          },
          groupBy,
        });

        return { weeks, rows };
      })
    );
  }

  getSectorWeeklyMatrix(start: string, end: string): Observable<any> {
    return this.getWeeklyReport(start, end, 'sector');
  }

  /**
   * Generic Matrix Generator
   * Groups meals by Sector/Employee and Buckets (Days/Weeks)
   */
  private generateMatrix<T extends { id: string }>(params: {
    meals: IMeal[];
    buckets: T[];
    bucketMatcher: (meal: IMeal, bucket: T) => boolean;
    groupBy: 'sector' | 'employee';
  }): { rows: any[]; totals: number[] } {
    const { meals, buckets, bucketMatcher, groupBy } = params;

    const groupMap: Record<
      string,
      {
        total: number;
        bucketCounts: Record<string, number>;
        label: string;
        secondaryLabel: string;
        totalValue: number;
      }
    > = {};

    meals.forEach((meal) => {
      // Find bucket
      const bucket = buckets.find((b) => bucketMatcher(meal, b));
      if (!bucket) return;

      // Determine Key & Label
      let key = '';
      let label = '';
      let secondaryLabel = '';

      const sector =
        meal.employeeSectorSnapshot || meal.employee?.setor || 'Sem Setor';
      const empName =
        meal.employeeNameSnapshot ||
        (meal.employee
          ? `${meal.employee.firstName} ${meal.employee.lastName}`
          : 'Sem Nome');
      const empMatricula =
        meal.matriculaSnapshot || meal.employee?.matricula || 'N/A';

      if (groupBy === 'sector') {
        key = sector;
        label = sector;
      } else {
        key = meal.employeeId
          ? meal.employeeId.toString()
          : `unlinked_${meal.matriculaSnapshot || 'unknown'}`;
        label = empName;
        secondaryLabel = empMatricula;
      }

      if (!groupMap[key]) {
        groupMap[key] = {
          total: 0,
          totalValue: 0,
          bucketCounts: {},
          label,
          secondaryLabel,
        };
      }

      groupMap[key].bucketCounts[bucket.id] =
        (groupMap[key].bucketCounts[bucket.id] || 0) + 1;
      groupMap[key].total++;
      groupMap[key].totalValue += this.MEAL_PRICE;
    });

    // Serialize
    const rows: any[] = [];
    Object.keys(groupMap).forEach((key) => {
      const data = groupMap[key];
      // Map back to ordered buckets
      const counts = buckets.map((b) => data.bucketCounts[b.id] || 0);

      // Create standardized row
      rows.push({
        key,
        label: data.label,
        secondaryLabel: data.secondaryLabel,
        // Standard props
        counts,
        values: counts.map((c) => c * this.MEAL_PRICE),
        // Aliases for compatibility with existing UI expectations (can be cleaned up later)
        dailyCounts: counts,
        weeklyCounts: counts,
        weeklyValues: counts.map((c) => c * this.MEAL_PRICE),

        totalQty: data.total,
        totalValue: data.totalValue,
      });
    });

    // Sort
    rows.sort((a, b) => {
      const diff = b.totalQty - a.totalQty;
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    });

    // Calculate Column Totals
    const totals = buckets.map((b, index) => {
      return rows.reduce((acc, row) => acc + row.counts[index], 0);
    });

    return { rows, totals };
  }
}
