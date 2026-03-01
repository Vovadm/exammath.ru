import { describe, it, expect } from 'vitest';
import { formatMath } from '@/lib/math-format';

describe('formatMath', () => {
  it('escapes HTML entities', () => {
    expect(formatMath('<b>bold</b>')).toContain('&lt;b&gt;');
    expect(formatMath('a & b')).toContain('&amp;');
  });

  it('renders inline images from [IMG:url]', () => {
    const result = formatMath('[IMG:https://example.com/img.png]');
    expect(result).toContain('<img');
    expect(result).toContain('src="https://example.com/img.png"');
    expect(result).toContain('alt="формула"');
  });

  it('renders multiple inline images', () => {
    const input = '[IMG:https://a.com/1.png] text [IMG:https://b.com/2.png]';
    const result = formatMath(input);
    expect(result).toContain('src="https://a.com/1.png"');
    expect(result).toContain('src="https://b.com/2.png"');
  });

  it('renders vectors with vec()', () => {
    const result = formatMath('vec(AB)');
    expect(result).toContain('AB');
    expect(result).toContain('<svg');
    expect(result).toContain('polyline');
  });

  it('renders fractions with (num/den)', () => {
    const result = formatMath('(1/2)');
    expect(result).toContain('1');
    expect(result).toContain('2');
    expect(result).toContain('border-b');
  });

  it('renders nth-root with root(n, x)', () => {
    const result = formatMath('root(3, 8)');
    expect(result).toContain('3');
    expect(result).toContain('8');
    expect(result).toContain('√');
  });

  it('renders square root with sqrt()', () => {
    const result = formatMath('sqrt(16)');
    expect(result).toContain('16');
    expect(result).toContain('√');
  });

  it('renders superscript with ^()', () => {
    const result = formatMath('x^(2)');
    expect(result).toContain('<sup');
    expect(result).toContain('2');
  });

  it('renders subscript with _()', () => {
    const result = formatMath('a_(n)');
    expect(result).toContain('<sub');
    expect(result).toContain('n');
  });

  it('returns plain text unchanged', () => {
    expect(formatMath('hello world')).toBe('hello world');
  });

  it('handles combined math notation', () => {
    const input = 'Найдите sqrt(x^(2)) если (a/b) = 3';
    const result = formatMath(input);
    expect(result).toContain('√');
    expect(result).toContain('border-b');
  });

  it('handles empty string', () => {
    expect(formatMath('')).toBe('');
  });

  it('handles nested parentheses in superscript', () => {
    const result = formatMath('x^((n+1))');
    expect(result).toContain('<sup');
    expect(result).toContain('n+1');
  });
});
