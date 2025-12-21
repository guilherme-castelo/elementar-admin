import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/services/api.service';
import { Observable, forkJoin, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private api = inject(ApiService);

  getStats(): Observable<{ users: number; companies: number }> {
    return forkJoin({
      users: this.api.get<any[]>('/users').pipe(map(users => users.length)),
      companies: this.api.get<any[]>('/companies').pipe(map(companies => companies.length))
    });
  }
}
