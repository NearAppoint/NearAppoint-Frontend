import { describe, it, expect } from 'vitest';
import { digitsOnly, isValidPkMobile, toE164, toLocalDisplay } from '../phone';

describe('phone normalisation', () => {
  it('every way a Pakistani writes their number maps to ONE key', () => {
    const forms = [
      '03001234567',
      '0300 1234567',
      '0300-1234567',
      '+923001234567',
      '+92 300 1234567',
      '923001234567',
      '00923001234567',
      '3001234567',
    ];
    const out = new Set(forms.map(toE164));
    // If this is ever > 1, the same woman gets two accounts and the salon
    // sees two customers with half her history each.
    expect(out.size).toBe(1);
    expect([...out][0]).toBe('+923001234567');
  });

  it('validates Pakistani mobiles (must start with 3)', () => {
    expect(isValidPkMobile('03001234567')).toBe(true);
    expect(isValidPkMobile('02001234567')).toBe(false);   // landline
    expect(isValidPkMobile('0300123456')).toBe(false);    // too short
    expect(isValidPkMobile('abc')).toBe(false);
  });

  it('throws rather than storing garbage', () => {
    expect(() => toE164('0212345678')).toThrow();
  });

  it('displays how a Pakistani reads it back', () => {
    expect(toLocalDisplay('+923001234567')).toBe('0300 1234567');
  });

  it('digitsOnly strips every prefix form', () => {
    expect(digitsOnly('00923001234567')).toBe('3001234567');
  });
});
