import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CustomDateAdapter extends NativeDateAdapter {
  override parse(value: any): Date | null {
    if ((typeof value === 'string') && (value.indexOf('/') > -1)) {
      const str = value.split('/');

      const day = Number(str[0]);
      const month = Number(str[1]) - 1;
      const year = Number(str[2]);

      if (isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
      }

      return new Date(year, month, day);
    }

    return super.parse(value);
  }

  override getFirstDayOfWeek(): number {
    return 0; // Sunday
  }
}

export const MY_DATE_FORMATS = {
  parse: {
    dateInput: 'l', // invalid format for NativeDateAdapter? Native relies on Intl options normally.
    // Actually, NativeDateAdapter doesn't use the parse format object for parsing in the default implementation, 
    // it just takes the input. But the parse method we overrode handles the string.
    // The keys here matter if using explicit MomentAdapter. 
    // For NativeAdapter, the display formats are Intl.DateTimeFormatOptions.
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};
