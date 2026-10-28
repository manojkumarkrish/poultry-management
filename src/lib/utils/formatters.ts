/**
 * Kasthuri Poultry Farm (KPF) Number & Currency Formatting Utilities
 * Enforces consistent Indian numbering system ('en-IN') across both SSR and client hydration
 * to prevent server/client HTML mismatches.
 */

export const INDIAN_LOCALE = 'en-IN';

const defaultNumberFormatter = new Intl.NumberFormat(INDIAN_LOCALE, {
  maximumFractionDigits: 2,
});

const defaultCurrencyFormatter = new Intl.NumberFormat(INDIAN_LOCALE, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

/**
 * Format a number using the Indian numbering system ('en-IN').
 * Examples:
 * - 103000 -> "1,03,000"
 * - 100000 -> "1,00,000"
 * - 1250000 -> "12,50,000"
 * - 2500 -> "2,500"
 */
export function formatNumber(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '0';

  if (!options) {
    return defaultNumberFormatter.format(num);
  }

  return new Intl.NumberFormat(INDIAN_LOCALE, {
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

/**
 * Alias for formatNumber with Indian numbering conventions.
 */
export const formatIndianNumber = formatNumber;

/**
 * Format a numeric value as INR currency using 'en-IN'.
 * Examples:
 * - 103000 -> "₹1,03,000.00" (or "₹1,03,000" if maximumFractionDigits: 0)
 * - 1250000 -> "₹12,50,000.00"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '₹0';
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '₹0';

  if (!options) {
    return defaultCurrencyFormatter.format(num);
  }

  return new Intl.NumberFormat(INDIAN_LOCALE, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

/**
 * Format date & time consistently using explicit 'en-IN' locale.
 */
export function formatDateTime(
  dateInput: string | number | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  return new Intl.DateTimeFormat(INDIAN_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  }).format(d);
}
