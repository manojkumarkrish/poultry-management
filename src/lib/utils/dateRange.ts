export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'last_7_days'
  | 'this_week'
  | 'previous_week'
  | 'last_30_days'
  | 'this_month'
  | 'previous_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_year'
  | 'previous_year'
  | 'financial_year'
  | 'custom';

export type GroupingInterval = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface DateRangeState {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  grouping: GroupingInterval;
  compareWithPrevious: boolean;
  prevStartDate?: string;
  prevEndDate?: string;
}

export function formatDateToISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseISODate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // Noon to prevent timezone boundary drift
}

/**
 * Calculates start and end dates for any of the 13 standard presets,
 * honoring configurable Financial Year start month (default: 4 for April).
 */
export function getDateRangeFromPreset(
  preset: DateRangePreset,
  fyStartMonth: number = 4,
  refDate: Date = new Date()
): { startDate: string; endDate: string } {
  const today = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate(), 12, 0, 0);
  const todayStr = formatDateToISO(today);

  switch (preset) {
    case 'today':
      return { startDate: todayStr, endDate: todayStr };

    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = formatDateToISO(y);
      return { startDate: yStr, endDate: yStr };
    }

    case 'last_7_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'this_week': {
      const day = today.getDay(); // 0 is Sunday, 1 is Monday
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(today);
      start.setDate(today.getDate() + diffToMonday);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'previous_week': {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const prevMonday = new Date(today);
      prevMonday.setDate(today.getDate() + diffToMonday - 7);
      const prevSunday = new Date(prevMonday);
      prevSunday.setDate(prevMonday.getDate() + 6);
      return { startDate: formatDateToISO(prevMonday), endDate: formatDateToISO(prevSunday) };
    }

    case 'last_30_days': {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'this_month': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'previous_month': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12, 0, 0);
      const end = new Date(today.getFullYear(), today.getMonth(), 0, 12, 0, 0);
      return { startDate: formatDateToISO(start), endDate: formatDateToISO(end) };
    }

    case 'last_3_months': {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'last_6_months': {
      const start = new Date(today);
      start.setDate(start.getDate() - 179);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'this_year': {
      const start = new Date(today.getFullYear(), 0, 1, 12, 0, 0);
      return { startDate: formatDateToISO(start), endDate: todayStr };
    }

    case 'previous_year': {
      const start = new Date(today.getFullYear() - 1, 0, 1, 12, 0, 0);
      const end = new Date(today.getFullYear() - 1, 11, 31, 12, 0, 0);
      return { startDate: formatDateToISO(start), endDate: formatDateToISO(end) };
    }

    case 'financial_year': {
      const currentMonth = today.getMonth() + 1; // 1-12
      let fyStartYear: number;
      if (currentMonth >= fyStartMonth) {
        fyStartYear = today.getFullYear();
      } else {
        fyStartYear = today.getFullYear() - 1;
      }
      const fyEndYear = fyStartYear + 1;
      const start = new Date(fyStartYear, fyStartMonth - 1, 1, 12, 0, 0);
      const end = new Date(fyEndYear, fyStartMonth - 1, 0, 12, 0, 0); // last day of month before start
      return {
        startDate: formatDateToISO(start),
        endDate: formatDateToISO(end > today ? today : end),
      };
    }

    case 'custom':
    default:
      return { startDate: todayStr, endDate: todayStr };
  }
}

/**
 * Calculates the immediately preceding equivalent period.
 * For example, if current period is 30 days long, the previous period is the 30 days
 * ending immediately before startDate.
 */
export function getPreviousEquivalentPeriod(
  startDate: string,
  endDate: string,
  preset?: DateRangePreset
): { prevStartDate: string; prevEndDate: string } {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);

  // Exact calendar month shift if preset was this_month
  if (preset === 'this_month') {
    const prevMonthStart = new Date(start.getFullYear(), start.getMonth() - 1, 1, 12, 0, 0);
    const prevMonthEnd = new Date(start.getFullYear(), start.getMonth(), 0, 12, 0, 0);
    return {
      prevStartDate: formatDateToISO(prevMonthStart),
      prevEndDate: formatDateToISO(prevMonthEnd),
    };
  }

  // Exact calendar year shift if preset was this_year
  if (preset === 'this_year') {
    const prevYearStart = new Date(start.getFullYear() - 1, 0, 1, 12, 0, 0);
    const prevYearEnd = new Date(start.getFullYear() - 1, 11, 31, 12, 0, 0);
    return {
      prevStartDate: formatDateToISO(prevYearStart),
      prevEndDate: formatDateToISO(prevYearEnd),
    };
  }

  // General duration-based equivalent shift
  const durationMs = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 86400000); // 1 day before start
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return {
    prevStartDate: formatDateToISO(prevStart),
    prevEndDate: formatDateToISO(prevEnd),
  };
}

/**
 * Determine a sensible default grouping interval based on the number of days in the range.
 */
export function getDefaultGrouping(startDate: string, endDate: string): GroupingInterval {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;

  if (days <= 14) return 'daily';
  if (days <= 90) return 'weekly';
  if (days <= 365) return 'monthly';
  return 'quarterly';
}

/**
 * Calculate absolute difference and percentage change between current and previous values.
 * Handles division by zero cleanly.
 */
export function calculateComparison(
  current: number,
  previous: number
): {
  diff: number;
  variance: number;
  pctChange: number | null;
  displayPct: string;
  pctChangeFormatted: string;
  isNew: boolean;
  trend: 'up' | 'down' | 'neutral';
} {
  const diff = current - previous;

  if (previous === 0) {
    if (current === 0) {
      return {
        diff: 0,
        variance: 0,
        pctChange: 0,
        displayPct: '0.0%',
        pctChangeFormatted: '0.0%',
        isNew: false,
        trend: 'neutral',
      };
    }
    return {
      diff,
      variance: diff,
      pctChange: null,
      displayPct: 'New Activity',
      pctChangeFormatted: 'New Activity',
      isNew: true,
      trend: current > 0 ? 'up' : 'down',
    };
  }

  const pct = (diff / Math.abs(previous)) * 100;
  const trend: 'up' | 'down' | 'neutral' = pct > 0.05 ? 'up' : pct < -0.05 ? 'down' : 'neutral';
  const prefix = pct > 0 ? '+' : '';
  const displayPct = `${prefix}${pct.toFixed(1)}%`;

  return {
    diff,
    variance: diff,
    pctChange: Number(pct.toFixed(2)),
    displayPct,
    pctChangeFormatted: displayPct,
    isNew: false,
    trend,
  };
}

/**
 * Splits date range into discrete intervals for trend charts.
 */
export function generateTimeSlots(
  startDate: string,
  endDate: string,
  grouping: GroupingInterval
): { key: string; label: string; start: string; end: string }[] {
  const start = parseISODate(startDate);
  const end = parseISODate(endDate);
  const slots: { key: string; label: string; start: string; end: string }[] = [];

  const curr = new Date(start);

  if (grouping === 'daily') {
    while (curr <= end) {
      const dateStr = formatDateToISO(curr);
      const label = curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
      slots.push({ key: dateStr, label, start: dateStr, end: dateStr });
      curr.setDate(curr.getDate() + 1);
    }
  } else if (grouping === 'weekly') {
    let weekIndex = 1;
    while (curr <= end) {
      const slotStart = formatDateToISO(curr);
      const weekEnd = new Date(curr);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const effectiveEnd = weekEnd > end ? new Date(end) : weekEnd;
      const slotEnd = formatDateToISO(effectiveEnd);

      const label = `W${weekIndex} (${curr.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })})`;
      slots.push({ key: slotStart, label, start: slotStart, end: slotEnd });

      curr.setDate(curr.getDate() + 7);
      weekIndex++;
    }
  } else if (grouping === 'monthly') {
    while (curr <= end) {
      const year = curr.getFullYear();
      const month = curr.getMonth();
      const monthStart = new Date(year, month, 1, 12, 0, 0);
      const monthEnd = new Date(year, month + 1, 0, 12, 0, 0);

      const effectiveStart = monthStart < start ? start : monthStart;
      const effectiveEnd = monthEnd > end ? end : monthEnd;

      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const label = curr.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

      slots.push({
        key,
        label,
        start: formatDateToISO(effectiveStart),
        end: formatDateToISO(effectiveEnd),
      });

      // Advance to next month
      curr.setMonth(curr.getMonth() + 1);
      curr.setDate(1);
    }
  } else if (grouping === 'quarterly') {
    while (curr <= end) {
      const year = curr.getFullYear();
      const quarter = Math.floor(curr.getMonth() / 3) + 1;
      const qStartMonth = (quarter - 1) * 3;
      const qEndMonth = qStartMonth + 2;

      const qStart = new Date(year, qStartMonth, 1, 12, 0, 0);
      const qEnd = new Date(year, qEndMonth + 1, 0, 12, 0, 0);

      const effectiveStart = qStart < start ? start : qStart;
      const effectiveEnd = qEnd > end ? end : qEnd;

      const key = `${year}-Q${quarter}`;
      const label = `Q${quarter} ${year}`;

      slots.push({
        key,
        label,
        start: formatDateToISO(effectiveStart),
        end: formatDateToISO(effectiveEnd),
      });

      curr.setMonth(curr.getMonth() + 3);
      curr.setDate(1);
    }
  } else {
    // Yearly
    while (curr <= end) {
      const year = curr.getFullYear();
      const yStart = new Date(year, 0, 1, 12, 0, 0);
      const yEnd = new Date(year, 11, 31, 12, 0, 0);

      const effectiveStart = yStart < start ? start : yStart;
      const effectiveEnd = yEnd > end ? end : yEnd;

      const key = `${year}`;
      const label = `${year}`;

      slots.push({
        key,
        label,
        start: formatDateToISO(effectiveStart),
        end: formatDateToISO(effectiveEnd),
      });

      curr.setFullYear(curr.getFullYear() + 1);
      curr.setMonth(0);
      curr.setDate(1);
    }
  }

  return slots;
}
