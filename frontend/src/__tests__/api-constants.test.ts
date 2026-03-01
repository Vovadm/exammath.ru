import { describe, it, expect } from 'vitest';
import { TYPE_NAMES } from '@/lib/api';

describe('TYPE_NAMES', () => {
  it('has all 20 types defined (0-19)', () => {
    for (let i = 0; i <= 19; i++) {
      expect(TYPE_NAMES[i]).toBeDefined();
      expect(typeof TYPE_NAMES[i]).toBe('string');
      expect(TYPE_NAMES[i].length).toBeGreaterThan(0);
    }
  });

  it('types 1-12 are part 1 (base exam)', () => {
    for (let i = 1; i <= 12; i++) {
      expect(TYPE_NAMES[i]).toBeDefined();
      expect(TYPE_NAMES[i]).not.toContain('ч.2');
    }
  });

  it('types 13-19 include (ч.2) label for relevant ones', () => {
    expect(TYPE_NAMES[13]).toContain('ч.2');
    expect(TYPE_NAMES[14]).toContain('ч.2');
    expect(TYPE_NAMES[17]).toContain('ч.2');
  });

  it('type 0 is "Не определён"', () => {
    expect(TYPE_NAMES[0]).toBe('Не определён');
  });

  it('returns undefined for non-existent types', () => {
    expect(TYPE_NAMES[20]).toBeUndefined();
    expect(TYPE_NAMES[-1]).toBeUndefined();
    expect(TYPE_NAMES[100]).toBeUndefined();
  });
});
