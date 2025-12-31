import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SessionService } from '../services/session.service';

export const companyInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const activeCompanyId = sessionService.activeCompanyId();

  if (activeCompanyId) {
    const cloned = req.clone({
      setHeaders: {
        'x-company-id': activeCompanyId.toString(),
      },
    });
    return next(cloned);
  }

  return next(req);
};
