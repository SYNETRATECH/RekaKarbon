export function toIsoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function toLowerEnum(value: string): string {
  return value.toLowerCase();
}
