import { describe, it, expect } from 'vitest';
import { normalizePhoneNumber } from '../src/utils/phone';

describe('Phone Normalization', () => {
  it('should normalize 10-digit Indian numbers', () => {
    expect(normalizePhoneNumber('9876543210')).toBe('+919876543210');
  });

  it('should normalize 11-digit Indian numbers starting with 0', () => {
    expect(normalizePhoneNumber('09876543210')).toBe('+919876543210');
  });

  it('should normalize 12-digit Indian numbers starting with 91', () => {
    expect(normalizePhoneNumber('919876543210')).toBe('+919876543210');
  });

  it('should leave already normalized Indian numbers alone', () => {
    expect(normalizePhoneNumber('+919876543210')).toBe('+919876543210');
  });

  it('should clean spaces, dashes, and parentheses', () => {
    expect(normalizePhoneNumber('+91 98765-43210')).toBe('+919876543210');
    expect(normalizePhoneNumber('(987) 654-3210')).toBe('+919876543210');
  });

  it('should not incorrectly modify other international numbers', () => {
    expect(normalizePhoneNumber('+14155552671')).toBe('+14155552671');
    expect(normalizePhoneNumber('+447911123456')).toBe('+447911123456');
  });

  it('should prefix + to valid international length numbers missing the plus', () => {
    expect(normalizePhoneNumber('447911123456')).toBe('+447911123456');
  });

  it('should handle short numbers gracefully', () => {
    expect(normalizePhoneNumber('12345')).toBe('12345');
  });
});
