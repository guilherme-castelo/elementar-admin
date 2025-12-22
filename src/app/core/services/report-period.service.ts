import { Injectable } from '@angular/core';

export interface IPeriod {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportPeriodService {

  /**
   * Calculates the billing period for a given Month and Year.
   * Rule:
   * - Starts on day 26 of previous month.
   * - Ends on day 25 of current selected month.
   * 
   * @param month 0-indexed (0 = Jan, 11 = Dec)
   * @param year Full year (e.g. 2024)
   */
  getPeriodByMonth(month: number, year: number): IPeriod {
    // Current Period End: 25th of selected month
    const end = new Date(year, month, 25);

    // Period Start: 26th of previous month
    // Date constructor handles month wrap-around (e.g. month -1 becomes Dec previous year)
    const start = new Date(year, month - 1, 26);

    return {
      start,
      end,
      startIso: start.toISOString(),
      endIso: end.toISOString()
    };
  }
}
