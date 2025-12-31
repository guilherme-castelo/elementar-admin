import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const sessionService = inject(SessionService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const memberships = sessionService.memberships();

    // Onboarding Redirect logic
    if (memberships.length === 0 && !state.url.startsWith('/onboarding')) {
      router.navigate(['/onboarding']);
      return false;
    }

    return true;
  }

  router.navigate(['/auth/signin']);
  return false;
};
