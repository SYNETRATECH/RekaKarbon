import { faker } from '@faker-js/faker';

export function seedFaker(seed = 20260830): void {
  faker.seed(seed);
}

export function fakeUuid(): string {
  return faker.string.uuid();
}

export function fakeWalletAddress(): string {
  const hex = faker.string
    .hexadecimal({ length: 40, prefix: '' })
    .toLowerCase();
  return `0x${hex}`;
}

export function fakeTxHash(): string {
  const hex = faker.string
    .hexadecimal({ length: 64, prefix: '' })
    .toLowerCase();
  return `0x${hex}`;
}

export function fakeNpwp(): string {
  const d = (len: number) => faker.string.numeric(len);
  return `${d(2)}.${d(3)}.${d(3)}.${d(1)}-${d(3)}.${d(3)}`;
}

export function fakeSpeCertificateId(year = 2026): string {
  const serial = faker.string.numeric(3);
  return `SPE-GRK-IDN-${year}-${serial}`;
}

export function fakeDateString(): string {
  return faker.date.recent({ days: 60 }).toISOString().split('T')[0];
}

export function fakeDateTimeString(): string {
  return faker.date.recent({ days: 60 }).toISOString();
}

export function fakeNdvi(): number {
  return Number(faker.number.float({ min: 0.1, max: 0.95, fractionDigits: 2 }));
}

export function fakeEvi(): number {
  return Number(faker.number.float({ min: 0.1, max: 0.85, fractionDigits: 2 }));
}

export function fakeIndonesianCoordinates(): [number, number] {
  const lat = Number(
    faker.number.float({ min: -8.8, max: -6.0, fractionDigits: 4 }),
  );
  const lng = Number(
    faker.number.float({ min: 106.0, max: 115.5, fractionDigits: 4 }),
  );
  return [lat, lng];
}
