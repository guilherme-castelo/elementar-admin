import { Injectable, signal, computed, effect } from '@angular/core';

export interface CompanySnapshot {
  id: number;
  name: string;
  type?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly COMPANY_KEY = 'active_company_id';
  private readonly MEMBERSHIPS_KEY = 'user_memberships';

  // Signals for reactive state
  private _activeCompanyId = signal<number | null>(this.loadActiveCompanyId());
  private _memberships = signal<any[]>(this.loadMemberships());

  readonly activeCompanyId = computed(() => this._activeCompanyId());
  readonly memberships = computed(() => this._memberships());

  readonly activeCompany = computed(() => {
    const id = this._activeCompanyId();
    if (!id) return null;
    return (
      this._memberships().find((m) => m.company.id === id)?.company || null
    );
  });

  constructor() {
    // Optional: Effect to sync with localStorage if needed explicitly,
    // but we do it in setters for simplicity and sync.
  }

  private loadActiveCompanyId(): number | null {
    const stored = localStorage.getItem(this.COMPANY_KEY);
    return stored ? parseInt(stored, 10) : null;
  }

  private loadMemberships(): any[] {
    const stored = localStorage.getItem(this.MEMBERSHIPS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  setMemberships(memberships: any[]) {
    if (!Array.isArray(memberships)) return;

    localStorage.setItem(this.MEMBERSHIPS_KEY, JSON.stringify(memberships));
    this._memberships.set(memberships);

    // Auto-select company if none selected or current is invalid
    const currentId = this._activeCompanyId();
    const isValid = memberships.some((m) => m.company.id === currentId);

    if (!currentId || !isValid) {
      if (memberships.length > 0) {
        // Default to first available company
        this.setActiveCompany(memberships[0].company.id);
      } else {
        this.clearActiveCompany();
      }
    }
  }

  setActiveCompany(companyId: number) {
    localStorage.setItem(this.COMPANY_KEY, companyId.toString());
    this._activeCompanyId.set(companyId);

    // Changing company might require a page reload or route navigation in some architectures,
    // but in a SPA we prefer just updating the state.
    // Ideally, we trigger a global event or the app reacts to the signal.
  }

  clearActiveCompany() {
    localStorage.removeItem(this.COMPANY_KEY);
    this._activeCompanyId.set(null);
  }

  clearSession() {
    this.clearActiveCompany();
    localStorage.removeItem(this.MEMBERSHIPS_KEY);
    this._memberships.set([]);
  }
}
