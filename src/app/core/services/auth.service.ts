import { Injectable, inject } from '@angular/core';
import { Observable, tap, map, catchError, of, throwError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  login(credentials: any): Observable<any> {
    // Mock implementation: Get user by email and check password client-side
    return this.api.get<any[]>(`/users?email=${credentials.email}`).pipe(
      // SwitchMap/MergeMap would be better but keeping it simple for prototype with nested logic inside map/tap or just forkJoin if we were parallelizing.
      // But we need the user first to know IF we should proceed.
      // Using switchMap to get roles after valid user.
      switchMap(users => {
        const user = users[0];
        if (user && user.password === credentials.password) {
          // User valid, now get roles
          return this.api.get<any[]>('/roles').pipe(
            map(roles => {
              // Flatten permissions
              const userPermissions = new Set<string>();
              user.roles.forEach((userRole: string) => {
                const roleDef = roles.find(r => r.name === userRole);
                if (roleDef && roleDef.permissions) {
                  roleDef.permissions.forEach((p: string) => userPermissions.add(p));
                }
              });

              return { user, permissions: Array.from(userPermissions) };
            })
          );
        }
        return throwError(() => new Error('Invalid credentials'));
      }),
      tap(({ user, permissions }) => {
        // Mock token generation
        const token = btoa(`${user.id}:${user.email}:${Date.now()}`);
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        localStorage.setItem('auth_permissions', JSON.stringify(permissions));
      }),
      map(({ user }) => user)
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('auth_permissions');
    this.router.navigate(['/auth/signin']);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  updateUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
