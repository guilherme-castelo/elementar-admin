import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { IMeal } from '../models/meal.model';
import { Observable, map } from 'rxjs';
import { IEmployee } from '../models/employee.model';
import { ReportPeriodService } from './report-period.service';

@Injectable({
  providedIn: 'root'
})
export class MealsService {
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private reportPeriodService = inject(ReportPeriodService);

  private readonly MEAL_PRICE = 3.00;

  /**
   * Calculates the billing period for a given date.
   * Delegates to ReportPeriodService based on the month of the provided date.
   * Ideally, callers should use ReportPeriodService directly, but kept for compatibility.
   */
  getPeriod(date: Date): { start: string, end: string } {
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

    const { startIso, endIso } = this.reportPeriodService.getPeriodByMonth(targetMonth, targetYear);
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

    const meal: Omit<IMeal, 'id'> = {
      employeeId: employee.id,
      employeeMatricula: employee.matricula,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      sector: employee.setor,
      companyId: currentUser?.companyId || employee.companyId || '1',
      date: dateIso,
      price: this.MEAL_PRICE,
      periodStart: start,
      periodEnd: end,
      createdAt: new Date().toISOString()
    };

    return this.api.post<IMeal>('/meals', meal);
  }

  delete(id: string): Observable<void> {
    return this.api.delete<void>(`/meals/${id}`);
  }

  getDailyMeals(dateIso: string): Observable<IMeal[]> {
    // Ensuring basic filter by date.
    // In production this should also filter by companyId.
    const user = this.authService.getUser();
    const companyQuery = user?.companyId ? `companyId=${user.companyId}&` : '';
    // JSON-SERVER uses 'date' query param directly if exact match, but date might have time components if not careful.
    // We assume ISO string YYYY-MM-DD for date field storage to be strict, or partial match.
    // Let's assume the storage is YYYY-MM-DDT... so we might need simple filter or 'like'.
    // For MVP/JSON-SERVER, strict equality on formatted string is best if we store simplified dates,
    // but here we stored full ISO.
    // A better approach for JSON-SERVER 'like' is `q`.
    // BUT, let's try strict filtering if we store just YYYY-MM-DD or full scan?
    // Let's rely on the fact we will treat `date` as a string bucket in frontend effectively, or `start` comparison.
    // Actually, `period` is better for reports.
    // For "Daily List", we can just fetch all for company and filter in memory or use ?date_like.
    return this.api.get<IMeal[]>(`/meals?${companyQuery}date_like=${dateIso.split('T')[0]}`);
  }

  getMealsByPeriod(periodStart: string, periodEnd: string): Observable<IMeal[]> {
    const user = this.authService.getUser();
    const companyQuery = user?.companyId ? `companyId=${user.companyId}&` : '';
    // Fetching by period logic on JSON-SERVER is tricky without range operators (gte, lte).
    // JSON-SERVER supports `key_gte` and `key_lte`.
    // Since we store periodStart/End on the record, we can filter by that specific period "bucket" if we want exact billing cycle match.
    // Or we filter by `date` range.
    // Storing `periodStart` allows us to just Get `?periodStart=X&periodEnd=Y` which aggregates perfectly.
    return this.api.get<IMeal[]>(`/meals?${companyQuery}periodStart=${periodStart}&periodEnd=${periodEnd}`);
  }

  getWeeklySummary(start: string, end: string): Observable<any> {
    return this.getMealsByPeriod(start, end).pipe(
      map(meals => {
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
  getDailyReport(date: Date, groupBy: 'sector' | 'employee' = 'sector'): Observable<any> {
    const { start, end } = this.getPeriod(date);
    return this.getMealsByPeriod(start, end).pipe(
      map(meals => this.generateDailyMatrix(meals, start, end, groupBy))
    );
  }

  // Deprecated: kept for backward compatibility if needed, or alias to new method
  getDailySectorMatrixByMonth(date: Date): Observable<any> {
    return this.getDailyReport(date, 'sector');
  }

  private generateDailyMatrix(meals: IMeal[], startIso: string, endIso: string, groupBy: 'sector' | 'employee'): any {
    const startDate = new Date(startIso);
    const endDate = new Date(endIso);

    // 1. Generate all valid days (Mon-Sat)
    const days: { label: string, dateIso: string, fullDate: Date }[] = [];
    let cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dayOfWeek = cursor.getDay();
      // 0 = Sun, 6 = Sat. Include 1..6 (Mon-Sat)
      if (dayOfWeek !== 0) {
        days.push({
          label: `${cursor.getDate().toString().padStart(2, '0')}/${(cursor.getMonth() + 1).toString().padStart(2, '0')}`,
          dateIso: cursor.toISOString().split('T')[0], // YYYY-MM-DD
          fullDate: new Date(cursor)
        });
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // 2. Group Meals
    const groupMap: Record<string, { total: number, days: Record<string, number>, label: string, secondaryLabel: string }> = {};

    meals.forEach(meal => {
      const mDateIso = meal.date.split('T')[0];
      const validDay = days.find(d => d.dateIso === mDateIso);

      if (validDay) {
        let key = '';
        let label = '';
        let secondaryLabel = '';

        if (groupBy === 'sector') {
          key = meal.sector;
          label = meal.sector;
        } else {
          // Employee Mode
          key = meal.employeeId.toString(); // Group by ID to be safe
          label = meal.employeeName;
          secondaryLabel = meal.employeeMatricula || '';
        }

        if (!groupMap[key]) {
          groupMap[key] = { total: 0, days: {}, label, secondaryLabel };
        }

        groupMap[key].days[mDateIso] = (groupMap[key].days[mDateIso] || 0) + 1;
        groupMap[key].total++;
      }
    });

    // 3. Serialize to rows
    const rows: any[] = [];
    Object.keys(groupMap).forEach(key => {
      const data = groupMap[key];
      const dailyCounts = days.map(d => data.days[d.dateIso] || 0);

      rows.push({
        key, // useful for tracking
        label: data.label, // Sector Name or Employee Name
        secondaryLabel: data.secondaryLabel, // Matricula (only for employee)
        dailyCounts,
        totalQty: data.total
      });
    });

    // Sort: by total quantity desc, then alpha
    rows.sort((a, b) => {
      const diff = b.totalQty - a.totalQty;
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    });

    // Calculate Totals per Day (Footer)
    const dailyTotals = days.map(d => {
      return rows.reduce((acc, row) => acc + (row.dailyCounts[days.indexOf(d)] || 0), 0);
    });

    return { days, rows, dailyTotals };
  }

  /**
   * Generates a matrix of Sector x Weeks (Mon-Sat).
   * Columns: W1 | W2 | W3 | W4 | W5 (Dynamic)
   */
  getSectorWeeklyMatrix(start: string, end: string): Observable<any> {
    return this.getMealsByPeriod(start, end).pipe(
      map(meals => {
        // 1. Identify all valid weeks within the period (Mon-Sat windows)
        // Since the period is 26th-25th, it spans 4-5 weeks.

        // Helper to get week number relative to the start of the period or ISO week
        // Let's create strict week buckets.
        // Week 1: First Monday on or after Start? Or just sequential 7-day blocks?
        // Requirement: "Identificar automaticamente todas as semanas existentes... segunda a sábado"

        // We will iterate from start date to end date and group days into Weeks.
        // A "Week" here is determined by Mondays.
        // If Period starts on Wed 26th, Week 1 includes Wed 26, Thu 27, Fri 28, Sat 29.
        // Week 2 starts Mon.

        const weeks: { label: string, start: Date, end: Date, id: string }[] = [];
        let cursor = new Date(start);
        const endDate = new Date(end);
        let weekIndex = 1;

        while (cursor <= endDate) {
          // Determine end of this week (next Saturday or Period End)
          // Mon = 1 ... Sat = 6, Sun = 0.

          // Find next Saturday
          let nextSat = new Date(cursor);
          const day = nextSat.getDay();
          const dist = 6 - day + (day === 0 ? -6 : 0); // distance to Sat
          if (day === 0) {
            // If cursor is Sunday, it belongs to no "Mon-Sat" work week effectively? 
            // Or previous week? 
            // Rule: "segunda a sábado". Sunday is ignored.
            // Skip Sunday
            cursor.setDate(cursor.getDate() + 1);
            continue;
          }

          nextSat.setDate(nextSat.getDate() + dist);

          // Clamp to Period End
          let weekEnd = nextSat > endDate ? new Date(endDate) : nextSat;

          weeks.push({
            label: `Semana ${weekIndex}`,
            id: `w${weekIndex}`,
            start: new Date(cursor),
            end: weekEnd
          });

          // Move cursor to next Monday
          const nextMon = new Date(nextSat);
          nextMon.setDate(nextMon.getDate() + 2); // Sat + 2 = Mon
          // Reset cursor to next Mon (or Sun -> +1) logic
          // Actually, simply: cursor = next day after weekEnd? 
          // If weekEnd was Sat, next is Sun (skip) -> Mon.
          // If weekEnd was Period End (e.g. Wed), loop terminates.

          cursor = new Date(weekEnd);
          cursor.setDate(cursor.getDate() + 1);
          if (cursor.getDay() === 0) cursor.setDate(cursor.getDate() + 1); // Skip Sun

          weekIndex++;
        }

        // 2. Group Meals
        const rows: any[] = [];
        const sectorMap: Record<string, { total: number, weeks: Record<string, number> }> = {};

        meals.forEach(meal => {
          const mDate = new Date(meal.date);
          const w = weeks.find(wk => mDate >= wk.start && mDate <= wk.end);
          if (w) {
            if (!sectorMap[meal.sector]) sectorMap[meal.sector] = { total: 0, weeks: {} };

            sectorMap[meal.sector].weeks[w.id] = (sectorMap[meal.sector].weeks[w.id] || 0) + 1;
            sectorMap[meal.sector].total++;
          }
        });

        // 3. Flatten
        Object.keys(sectorMap).forEach(sector => {
          const data = sectorMap[sector];
          const weeklyCounts = weeks.map(w => data.weeks[w.id] || 0);
          rows.push({
            sector,
            weeklyCounts,
            weeklyValues: weeklyCounts.map(c => c * this.MEAL_PRICE),
            totalQty: data.total,
            totalValue: data.total * this.MEAL_PRICE
          });
        });

        rows.sort((a, b) => b.totalQty - a.totalQty);

        return { weeks, rows };
      })
    );
  }
}
