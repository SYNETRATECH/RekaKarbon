import { BadRequestException } from '@nestjs/common';
import {
  isRecord,
  requiredString,
  positiveNumber,
  enumValue,
} from './validation.util';

describe('validation.util', () => {
  describe('isRecord', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({})).toBe(true);
      expect(isRecord({ a: 1 })).toBe(true);
    });

    it('returns false for primitives, null, undefined, or arrays', () => {
      expect(isRecord(null)).toBe(false);
      expect(isRecord(undefined)).toBe(false);
      expect(isRecord([])).toBe(false);
      expect(isRecord('test')).toBe(false);
      expect(isRecord(123)).toBe(false);
      expect(isRecord(true)).toBe(false);
    });
  });

  describe('requiredString', () => {
    it('returns the string when valid and non-empty', () => {
      expect(requiredString('hello', 'testField')).toBe('hello');
    });

    it('throws BadRequestException for non-string or whitespace-only values', () => {
      expect(() => requiredString('', 'name')).toThrow(BadRequestException);
      expect(() => requiredString('   ', 'name')).toThrow(BadRequestException);
      expect(() => requiredString(null, 'name')).toThrow(BadRequestException);
      expect(() => requiredString(123, 'name')).toThrow(BadRequestException);
    });
  });

  describe('positiveNumber', () => {
    it('returns the numeric value when positive finite number or numeric string', () => {
      expect(positiveNumber(42, 'count')).toBe(42);
      expect(positiveNumber('12.5', 'count')).toBe(12.5);
    });

    it('throws BadRequestException for zero, negative, NaN, or non-finite values', () => {
      expect(() => positiveNumber(0, 'qty')).toThrow(BadRequestException);
      expect(() => positiveNumber(-5, 'qty')).toThrow(BadRequestException);
      expect(() => positiveNumber('abc', 'qty')).toThrow(BadRequestException);
      expect(() => positiveNumber(Infinity, 'qty')).toThrow(
        BadRequestException,
      );
      expect(() => positiveNumber(null, 'qty')).toThrow(BadRequestException);
    });
  });

  describe('enumValue', () => {
    const ALLOWED = ['opt_a', 'opt_b'] as const;

    it('returns value when present in allowed list', () => {
      expect(enumValue('opt_a', ALLOWED, 'option')).toBe('opt_a');
      expect(enumValue('opt_b', ALLOWED, 'option')).toBe('opt_b');
    });

    it('throws BadRequestException when value is not in allowed list or non-string', () => {
      expect(() => enumValue('invalid', ALLOWED, 'option')).toThrow(
        BadRequestException,
      );
      expect(() => enumValue(null, ALLOWED, 'option')).toThrow(
        BadRequestException,
      );
    });
  });
});
