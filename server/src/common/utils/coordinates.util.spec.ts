import { parseProjectCoordinates } from './coordinates.util';

describe('parseProjectCoordinates', () => {
  it('returns an empty array for non-array or nullish values', () => {
    expect(parseProjectCoordinates(null)).toEqual([]);
    expect(parseProjectCoordinates(undefined)).toEqual([]);
    expect(parseProjectCoordinates(123)).toEqual([]);
    expect(parseProjectCoordinates('invalid')).toEqual([]);
    expect(parseProjectCoordinates({})).toEqual([]);
  });

  it('correctly parses tuple coordinates [lat, lng]', () => {
    const raw = [
      [-6.2088, 106.8456],
      [-6.2, 106.85],
    ];
    expect(parseProjectCoordinates(raw)).toEqual([
      { lat: -6.2088, lng: 106.8456 },
      { lat: -6.2, lng: 106.85 },
    ]);
  });

  it('correctly parses object coordinates { lat, lng }', () => {
    const raw = [
      { lat: -6.2088, lng: 106.8456 },
      { lat: '-6.2000', lng: '106.8500' },
    ];
    expect(parseProjectCoordinates(raw)).toEqual([
      { lat: -6.2088, lng: 106.8456 },
      { lat: -6.2, lng: 106.85 },
    ]);
  });

  it('filters out invalid or incomplete items', () => {
    const raw = [
      [-6.2088, 106.8456],
      [-6.2], // length < 2
      'corrupted',
      null,
      { lat: 'not-a-number', lng: 106.8 },
      { lat: NaN, lng: 106.8 },
      { lat: Infinity, lng: 106.8 },
      { lat: -6.3, lng: 106.9 },
    ];

    expect(parseProjectCoordinates(raw)).toEqual([
      { lat: -6.2088, lng: 106.8456 },
      { lat: -6.3, lng: 106.9 },
    ]);
  });
});
