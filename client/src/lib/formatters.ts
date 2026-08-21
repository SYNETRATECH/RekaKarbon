/**
 * Standard formatting utilities for numbers, currencies, and carbon metrics
 * across the RekaKarbon application.
 */

export function parseNumeric(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;

  // Clean string formatted numbers (e.g. "Rp 450.000", "5.8 Miliar", etc.)
  const cleaned = String(value).replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function formatNumber(
  value: number | string | null | undefined,
  minFrac = 0,
  maxFrac = 2
): string {
  const num = parseNumeric(value);
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: minFrac,
    maximumFractionDigits: maxFrac,
  }).format(num);
}

/**
 * Standard IDR Currency Formatter.
 * Formats numbers into standard Indonesian Rupiah notation (e.g. Rp 200.000.000).
 */
export function formatCurrency(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Rp 0';
  const num = parseNumeric(value);
  const formatted = new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
  return `Rp ${formatted}`;
}

/**
 * Formats carbon sequestration tonnage (tCO₂e).
 * Example: 48200 -> "48.200 tCO₂e"
 */
export function formatCarbon(value: number | string | null | undefined, unit = 'tCO₂e'): string {
  const num = parseNumeric(value);
  return `${formatNumber(num, 0, 1)} ${unit}`;
}

/**
 * Formats spatial land area (hectares).
 * Example: 2450 -> "2.450 ha"
 */
export function formatArea(value: number | string | null | undefined, unit = 'ha'): string {
  const num = parseNumeric(value);
  return `${formatNumber(num, 0, 1)} ${unit}`;
}

/**
 * Formats percentage metrics.
 * Example: 96.4 -> "96,4%"
 */
export function formatPercent(value: number | string | null | undefined, decimals = 1): string {
  const num = parseNumeric(value);
  return `${formatNumber(num, decimals, decimals)}%`;
}

/**
 * Formats file size in bytes to human-readable string.
 * Example: 2450000 -> "2,45 MB"
 */
export function formatFileSize(bytesOrStr: number | string | null | undefined): string {
  if (bytesOrStr === null || bytesOrStr === undefined || bytesOrStr === '') return '0 B';
  if (typeof bytesOrStr === 'string' && /[a-zA-Z]/.test(bytesOrStr)) {
    return bytesOrStr; // already formatted string
  }
  const bytes = parseNumeric(bytesOrStr);
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const num = bytes / Math.pow(k, i);

  return `${formatNumber(num, 0, 2)} ${sizes[i]}`;
}

/**
 * Formats generic line-item quantities with optional unit of measurement.
 * Example: (400, "Karung") -> "400 Karung"
 * Example: (40000, "Batang") -> "40.000 Batang"
 */
export function formatQuantity(qty: number | string | null | undefined, unit?: string): string {
  const num = parseNumeric(qty);
  const formattedNum = formatNumber(num, 0, 0);
  return unit ? `${formattedNum} ${unit}` : formattedNum;
}
