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

  signUp(userData: any): Observable<any> {
    // Check if user exists first? For MVP, simulate check or just post.
    // JSON-Server will error 500 on duplicate ID, but email needs manual check if using 'users' endpoint roughly.
    // Let's assume the component or a pre-check handles validity, or we just Post.

    // Simulate slight delay
    return of(true).pipe(
      switchMap(() => {
        // Create a default user structure
        const newUser = {
          ...userData,
          id: null, // Let server generate
          roles: ['user'], // Default role
          permissions: [],
          companyId: 1, // Default company
          preferences: {
            language: { code: 'pt', name: 'Portuguese (Brazil)' },
            dateFormat: 'DD/MM/YYYY',
            automaticTimeZone: { name: 'GMT-03:00', isEnabled: true }
          }
        };
        return this.api.post('/users', newUser);
      })
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    // Simulate finding user
    return this.api.get<any[]>(`/users?email=${email}`).pipe(
      map(users => {
        if (users.length > 0) return true;
        // In a real app we might not want to reveal if email exists, 
        // but for MVP flow/UX we often show "Link sent" regardless or error if "User not found" (depending on reqs).
        // Let's return true to simulate success.
        return true;
      }),
      switchMap(exists => {
        if (exists) return of(true);
        return throwError(() => new Error('Email not found'));
      })
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
