import {
  ApplicationConfig,
  inject,
  PLATFORM_ID,
  provideAppInitializer,
  LOCALE_ID,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideEchartsCore } from 'ngx-echarts';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import {
  CustomDateAdapter,
  MY_DATE_FORMATS,
} from './core/providers/custom-date-adapter';

registerLocaleData(localePt);
import {
  provideRouter,
  TitleStrategy,
  withViewTransitions,
} from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { companyInterceptor } from './core/interceptors/company.interceptor';
import {
  ENVIRONMENT,
  EnvironmentService,
  GlobalStore,
  PageTitleStrategyService,
} from '@elementar-ui/components/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { environment } from '../environments/environment';
import { LayoutSidebarStore } from '@elementar-ui/components/layout';
import {
  COLOR_SCHEME_LOCAL_KEY,
  ColorScheme,
  ColorSchemeStore,
} from '@elementar-ui/components/color-scheme';
import { isPlatformBrowser } from '@angular/common';

export const appConfig: ApplicationConfig = {
  providers: [
    ColorSchemeStore,
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, companyInterceptor])
    ),
    provideStore(),
    provideEchartsCore({ echarts: () => import('echarts') }),
    {
      provide: ENVIRONMENT,
      useValue: environment,
    },
    {
      provide: TitleStrategy,
      useClass: PageTitleStrategyService,
    },
    provideAppInitializer(() => {
      const envService = inject(EnvironmentService);
      const globalStore = inject(GlobalStore);
      const layoutSidebarStore = inject(LayoutSidebarStore);
      const platformId = inject(PLATFORM_ID);
      const colorSchemeStore = inject(ColorSchemeStore);
      return new Promise((resolve, reject) => {
        if (isPlatformBrowser(platformId)) {
          const localColorScheme = localStorage
            ? (localStorage.getItem(COLOR_SCHEME_LOCAL_KEY) as ColorScheme) ||
              'light'
            : 'light';
          // but the best solution set it from backend
          colorSchemeStore.setScheme(localColorScheme);
        }

        layoutSidebarStore.showSidebarVisibility('root', true);
        globalStore.setPageTitle(envService.getValue('pageTitle'));
        resolve(true);
      });
    }),
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MY_DATE_FORMATS },
  ],
};
