import { describe, it, expect } from 'vitest';
import { formatDateTime } from '@/lib/format-date';

describe('formatDateTime', () => {
  it('formats ISO date string in Russian locale', () => {
    const result = formatDateTime('2025-06-15T14:30:00Z');
    expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('uses Moscow timezone', () => {
    const result = formatDateTime('2025-01-01T00:00:00Z');
    expect(result).toContain('03:00');
  });

  it('handles midnight correctly', () => {
    const result = formatDateTime('2025-06-15T21:00:00Z');
    expect(result).toMatch(/16\.06\.2025/);
    expect(result).toContain('00:00');
  });

  it('formats date with leading zeros', () => {
    const result = formatDateTime('2025-03-05T07:05:00Z');
    expect(result).toMatch(/05\.03\.2025/);
  });
});
