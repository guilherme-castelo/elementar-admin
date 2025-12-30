import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { IEmployee } from '../models/employee.model';

@Injectable({
  providedIn: 'root',
})
export class EmployeesService {
  private api = inject(ApiService);

  getAll(): Observable<IEmployee[]> {
    return this.api.get<IEmployee[]>('/employees');
  }

  getById(id: string): Observable<IEmployee> {
    return this.api.get<IEmployee>(`/employees/${id}`);
  }

  create(employee: Omit<IEmployee, 'id'>): Observable<IEmployee> {
    return this.api.post<IEmployee>('/employees', employee);
  }

  update(id: string, employee: Partial<IEmployee>): Observable<IEmployee> {
    return this.api.put<IEmployee>(`/employees/${id}`, employee);
  }

  delete(id: string, mealsAction?: string): Observable<void> {
    const params: any = {};
    if (mealsAction) params.mealsAction = mealsAction;
    return this.api.delete<void>(`/employees/${id}`, params);
  }

  countLinkedMeals(id: string): Observable<{ count: number }> {
    return this.api.get<{ count: number }>(`/meals/count/employee/${id}`);
  }
}
