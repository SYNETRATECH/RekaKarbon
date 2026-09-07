import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { isRecord } from '../../common/utils';

export function scopeValue(value: unknown): 1 | 2 | 3 {
  const parsed = Number(value);
  if (parsed !== 1 && parsed !== 2 && parsed !== 3) {
    throw new BadRequestException(
      'Scope aktivitas harus bernilai 1, 2, atau 3',
    );
  }
  return parsed;
}

export function metadataValue(value: unknown): Prisma.InputJsonObject {
  if (!isRecord(value)) return {};
  const result: Record<string, Prisma.InputJsonValue> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') result[key] = item;
    else if (typeof item === 'number' && Number.isFinite(item))
      result[key] = item;
    else if (typeof item === 'boolean') result[key] = item;
  }
  return result;
}
