import { Injectable } from '@angular/core';

export interface IPeriod {
  start: Date;
  end: Date;
  startIso: string;
  endIso: string;
  startStr: string;
  endStr: string;
}

@Injectable({
  providedIn: 'root',
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
      endIso: end.toISOString(),
      startStr: start.toISOString().split('T')[0],
      endStr: end.toISOString().split('T')[0],
    };
  }

  /**
   * Returns the month and year of the CURRENT billing period based on today's date.
   * If today > 25, it's already the NEXT booking month.
   */
  getCurrentBillingMonthYear(): { month: number; year: number } {
    const today = new Date();
    let month = today.getMonth(); // 0-11
    let year = today.getFullYear();
    const day = today.getDate();

    if (day > 25) {
      // Move to next billing period
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return { month, year };
  }
}
