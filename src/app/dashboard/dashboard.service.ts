import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { MealsService } from '../core/services/meals.service';
import { ReportPeriodService } from '../core/services/report-period.service';
import { EmployeesService } from '../core/services/employees.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private api = inject(ApiService);
  private mealsService = inject(MealsService);
  private employeesService = inject(EmployeesService);
  private reportPeriodService = inject(ReportPeriodService);

  // Compatibility for legacy widgets
  getStats(): Observable<{ users: number; companies: number }> {
    return this.getDashboardData().pipe(
      map((data) => ({
        users: data.usersCount,
        companies: data.companiesCount,
      }))
    );
  }

  getDashboardData(): Observable<any> {
    const today = new Date();
    const period = this.reportPeriodService.getPeriodByMonth(
      today.getMonth(),
      today.getFullYear()
    );
    const todayIso = today.toISOString();

    return forkJoin({
      system: forkJoin({
        users: this.api.get<any[]>('/users').pipe(catchError(() => of([]))),
        companies: this.api
          .get<any[]>('/companies')
          .pipe(catchError(() => of([]))),
      }),
      employees: this.employeesService.getAll().pipe(catchError(() => of([]))),
      billing: this.mealsService
        .getWeeklySummary(period.startIso, period.endIso)
        .pipe(catchError(() => of({ totalQty: 0, totalValue: 0 }))),
      todayMeals: this.mealsService.getDailyMeals(todayIso).pipe(
        map((m) => m.length),
        catchError(() => of(0))
      ),
      integration: this.api
        .get<any>('/integrations/dominio/config')
        .pipe(catchError(() => of(null))),
      myTasks: this.api.get<any[]>('/tasks').pipe(
        map((tasks) => {
          return tasks;
        }),
        catchError(() => of([]))
      ),
      recentChats: this.api.get<any[]>('/chat/conversations').pipe(
        map((convs) => convs.slice(0, 5)),
        catchError(() => of([]))
      ),
    }).pipe(
      map((data) => {
        const activeEmployees =
          data.employees?.filter((e: any) => !e.dataDemissao).length || 0;
        const inactiveEmployees =
          (data.employees?.length || 0) - activeEmployees;

        return {
          usersCount: data.system.users?.length || 0,
          systemUsers: data.system.users || [],
          companiesCount: data.system.companies?.length || 0,
          employeesCount: data.employees?.length || 0,
          activeEmployeesCount: activeEmployees,
          inactiveEmployeesCount: inactiveEmployees,
          monthlyMealsQty: data.billing.totalQty,
          monthlyMealsValue: data.billing.totalValue,
          todayMealsQty: data.todayMeals,
          integration: data.integration,
          myTasks: data.myTasks,
          recentChats: data.recentChats,
        };
      })
    );
  }

  getMealStats(
    start: string,
    end: string
  ): Observable<{ qty: number; value: number }> {
    return this.mealsService
      .getMealsInDateRange(start, end)
      .pipe(map((meals) => ({ qty: meals.length, value: meals.reduce((total, meal) => total + Number(meal.price || 0), 0) })));
  }
}
