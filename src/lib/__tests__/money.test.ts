import { describe, it, expect } from 'vitest';
import { normalizeCurrency, formatPKR } from '../money';

/**
 * These tests exist because this exact bug shipped in Muddarris.
 * They are not ceremony.
 */
describe('normalizeCurrency', () => {
  it('accepts the canonical form', () => {
    expect(normalizeCurrency('PKR')).toBe('PKR');
  });

  it('normalises lowercase — THE MUDDARRIS BUG', () => {
    expect(normalizeCurrency('pkr')).toBe('PKR');
    expect(normalizeCurrency('Pkr')).toBe('PKR');
    expect(normalizeCurrency(' pkr ')).toBe('PKR');
  });

  it('every casing collapses to ONE value, so string comparison is safe', () => {
    const forms = ['PKR', 'pkr', 'Pkr', 'pKr', ' PKR '];
    const out = new Set(forms.map(normalizeCurrency));
    expect(out.size).toBe(1);      // if this is ever 2, money starts disappearing
  });

  it('rejects anything unsupported rather than silently passing it through', () => {
    expect(() => normalizeCurrency('EUR')).toThrow();
    expect(() => normalizeCurrency('')).toThrow();
  });
});

describe('formatPKR', () => {
  it('has no decimals — PKR has no practical subunit here', () => {
    expect(formatPKR(1500)).not.toContain('.');
  });
});
