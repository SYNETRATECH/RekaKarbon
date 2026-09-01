import { toIsoDate, toLowerEnum } from './normalization.util';

describe('normalization utilities', () => {
  it('converts nullable dates to ISO strings', () => {
    const date = new Date('2026-09-01T00:00:00.000Z');

    expect(toIsoDate(date)).toBe('2026-09-01T00:00:00.000Z');
    expect(toIsoDate(null)).toBeNull();
  });

  it('normalizes enum values to lowercase', () => {
    expect(toLowerEnum('MINISTRY_REVIEW')).toBe('ministry_review');
  });
});
