import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  private readonly STORAGE_KEY = 'print_payload_data';

  setPrintData(data: any) {
    if (data) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  getPrintData() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }

  clearData() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
