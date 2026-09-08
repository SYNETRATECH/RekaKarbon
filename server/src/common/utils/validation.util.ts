import { BadRequestException } from '@nestjs/common';

export type RecordValue = Record<string, unknown>;

export function isRecord(value: unknown): value is RecordValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new BadRequestException(
      `Field ${field} harus berupa teks dan tidak boleh kosong`,
    );
  }
  return value;
}

export function positiveNumber(value: unknown, field: string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new BadRequestException(
      `Field ${field} harus berupa angka lebih besar dari nol`,
    );
  }
  return parsed;
}

export function enumValue<T extends string>(
  value: unknown,
  values: readonly T[],
  field: string,
): T {
  if (typeof value !== 'string' || !values.includes(value as T)) {
    throw new BadRequestException(`Nilai ${field} tidak didukung`);
  }
  return value as T;
}
