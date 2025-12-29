import { Injectable, inject } from '@angular/core';
import { Observable, tap, map, catchError, of, throwError, switchMap } from 'rxjs';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import { PermissionService } from './permission.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private permissionService = inject(PermissionService);
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  login(credentials: any): Observable<any> {
    return this.api.post('/auth/login', credentials).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.updateUser(response.user);
          if (response.permissions) {
            this.permissionService.setPermissions(response.permissions);
          }
        }
      }),
      map((response: any) => response.user)
    );
  }

  logout(): void {
    this.api.post('/auth/logout', {}).subscribe(() => {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      this.permissionService.setPermissions([]);
      this.router.navigate(['/auth/signin']);
    });
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

  signUp(userData: any): Observable<any> {
    return this.api.post('/auth/register', userData).pipe(
      tap((response: any) => {
        if (response && response.token) {
          localStorage.setItem(this.TOKEN_KEY, response.token);
          this.updateUser(response.user);
          if (response.permissions) {
            this.permissionService.setPermissions(response.permissions);
          }
        }
      })
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    // Check if email format is valid (simple check)
    if (!email || !email.includes('@')) {
      return throwError(() => new Error('Invalid email'));
    }

    // Simulate API delay and success.
    // Ideally we would POST to /auth/forgot-password, but backend doesn't support it yet.
    // Returing true to allow UI to show "Reset link sent".
    // We store the email in local storage to simulate the "token" verification flow later if needed.
    localStorage.setItem('reset_pending_email', email);
    return of(true).pipe(
      // delay(1000) // optional delay simulation
    );
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    // Token is fake. 
    // For MVP, if we want to actually change the password of a user, we need to know WHICH user.
    // Since we don't have a real backend token validation, we can:
    // A) Ask for Email again on the Reset Page (common in some flows)
    // B) Store a "reset_token_pending" in localStorage for the simulation
    // C) Just pick a dummy user (like the last one logged in or 'user@empresa.test')

    // Let's go with B for better simulation: ForgotPassword sets a temp email/token in local storage.
    const pendingEmail = localStorage.getItem('reset_pending_email');

    if (!pendingEmail) {
      return throwError(() => new Error('Invalid or expired token'));
    }

    return this.api.get<any[]>(`/users?email=${pendingEmail}`).pipe(
      switchMap(users => {
        if (users.length === 0) return throwError(() => new Error('User not found'));
        const user = users[0];
        const updatedUser = { ...user, password: newPassword };
        return this.api.put(`/users/${user.id}`, updatedUser);
      }),
      tap(() => {
        localStorage.removeItem('reset_pending_email'); // Cleanup
      })
    );
  }

  updateUser(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }
}
