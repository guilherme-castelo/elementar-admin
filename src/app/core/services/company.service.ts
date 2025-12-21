import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private api = inject(ApiService);

  getCompanies(): Observable<any[]> {
    return this.api.get<any[]>('/companies');
  }

  getCompany(id: string): Observable<any> {
    return this.api.get<any>(`/companies/${id}`);
  }

  createCompany(company: any): Observable<any> {
    return this.api.post<any>('/companies', company);
  }

  updateCompany(id: string, company: any): Observable<any> {
    return this.api.put<any>(`/companies/${id}`, company);
  }

  deleteCompany(id: string): Observable<any> {
    return this.api.delete<any>(`/companies/${id}`);
  }
}
