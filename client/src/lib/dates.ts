export const APP_LOCALE = 'id-ID';
export const APP_TIME_ZONE = 'Asia/Jakarta';

const CLOCK_LOCALE = 'en-GB';

export type DateInput = string | number | Date | null | undefined;

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getParts(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
  locale: string = APP_LOCALE
): Intl.DateTimeFormatPart[] {
  const date = toDate(value);
  if (!date) return [];
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).formatToParts(date);
}

function formatInLocale(
  value: DateInput,
  options: Intl.DateTimeFormatOptions,
  locale: string = APP_LOCALE
): string {
  const date = toDate(value);
  if (!date) return String(value ?? '');
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(date);
}

export function formatTime(value: DateInput): string {
  const parts = getParts(
    value,
    { hour: '2-digit', minute: '2-digit', hour12: false },
    CLOCK_LOCALE
  );
  if (parts.length === 0) return String(value ?? '');
  const find = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  return `${find('hour')}:${find('minute')}`;
}

export function formatShortDay(value: DateInput): string {
  return formatInLocale(value, { weekday: 'short' });
}

export function formatMonthShort(value: DateInput): string {
  return formatInLocale(value, { month: 'short' });
}

export function formatMonthNumber(monthIndex: number): string {
  if (!monthIndex || monthIndex < 1 || monthIndex > 12) return '';
  return formatInLocale(new Date(2000, monthIndex - 1, 1), { month: 'short' });
}

export function formatMonthYear(value: DateInput): string {
  return formatInLocale(value, { month: 'short', year: 'numeric' });
}

export function formatDate(value: DateInput): string {
  return formatInLocale(value, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatLongDate(value: DateInput): string {
  return formatInLocale(value, { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatShortDate(value: DateInput): string {
  return formatInLocale(value, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value: DateInput): string {
  return formatInLocale(value, {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatShortDateTime(value: DateInput): string {
  return formatInLocale(value, { dateStyle: 'short', timeStyle: 'short' });
}

export function toDateOnlyISO(value: DateInput): string {
  const parts = getParts(value, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');
  if (parts.length === 0) return String(value ?? '');
  return parts
    .filter((p) => p.type !== 'literal')
    .map((p) => p.value)
    .join('-');
}

export function formatLastSeen(lastSeen?: DateInput): string {
  if (lastSeen === null || lastSeen === undefined || lastSeen === '') return 'Baru saja';

  const date = toDate(lastSeen);
  if (!date) return String(lastSeen);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60 * 1000) return 'Baru saja';

  const diffMinutes = Math.floor(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} jam yang lalu`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} hari yang lalu`;

  return formatInLocale(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
