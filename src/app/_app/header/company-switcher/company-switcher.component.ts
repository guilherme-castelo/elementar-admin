import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SessionService } from '../../../core/services/session.service';

@Component({
  selector: 'app-company-switcher',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    @if (activeCompany()) {
    <button
      mat-button
      [matMenuTriggerFor]="companyMenu"
      class="!px-3 !min-w-0"
      matTooltip="Trocar Empresa"
    >
      <div class="flex items-center gap-2">
        <div
          class="flex items-center justify-center size-6 rounded bg-primary/10 text-primary font-bold text-xs uppercase"
        >
          {{ activeCompany()?.name?.charAt(0) }}
        </div>
        <span
          class="hidden sm:inline max-w-[150px] truncate text-sm font-medium"
        >
          {{ activeCompany()?.name }}
        </span>
        <mat-icon class="icon-sm text-neutral-500">expand_more</mat-icon>
      </div>
    </button>

    <mat-menu #companyMenu="matMenu">
      <div
        class="px-4 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider"
      >
        Suas Empresas
      </div>

      @for (item of memberships(); track item.company.id) {
      <button
        mat-menu-item
        (click)="switchCompany(item.company.id)"
        [class.bg-neutral-50]="item.company.id === activeCompany()?.id"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center size-8 rounded bg-neutral-100 text-neutral-600 font-bold text-xs uppercase"
            [class.bg-primary-100]="item.company.id === activeCompany()?.id"
            [class.text-primary-700]="item.company.id === activeCompany()?.id"
          >
            {{ item.company.name.charAt(0) }}
          </div>
          <div class="flex flex-col">
            <span class="font-medium line-clamp-1">{{
              item.company.name
            }}</span>
            <span class="text-xs text-neutral-500 capitalize">{{
              item.role.name
            }}</span>
          </div>
          @if (item.company.id === activeCompany()?.id) {
          <mat-icon class="ms-auto text-primary">check</mat-icon>
          }
        </div>
      </button>
      }
    </mat-menu>
    }
  `,
  styles: [
    `
      .icon-sm {
        height: 18px;
        width: 18px;
        font-size: 18px;
      }
    `,
  ],
})
export class CompanySwitcherComponent {
  private session = inject(SessionService);

  activeCompany = this.session.activeCompany;
  memberships = this.session.memberships;

  switchCompany(companyId: number) {
    if (this.session.activeCompanyId() !== companyId) {
      this.session.setActiveCompany(companyId);
      window.location.reload(); // Reload to refresh data context
    }
  }
}
