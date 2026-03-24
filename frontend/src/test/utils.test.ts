import { describe, it, expect } from 'vitest';

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function stripMask(value: string): string {
  return value.replace(/\D/g, '');
}

describe('formatCPF', () => {
  it('should format CPF correctly', () => {
    expect(formatCPF('12345678901')).toBe('123.456.789-01');
    expect(formatCPF('1234567890')).toBe('123.456.7890');
    expect(formatCPF('123456')).toBe('123.456');
    expect(formatCPF('123')).toBe('123');
    expect(formatCPF('')).toBe('');
  });

  it('should strip non-digits', () => {
    expect(stripMask('123.456.789-01')).toBe('12345678901');
    expect(stripMask('(11) 98765-4321')).toBe('11987654321');
  });
});

describe('formatPhone', () => {
  it('should format phone correctly', () => {
    expect(formatPhone('11987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
    expect(formatPhone('11')).toBe('(11');
    expect(formatPhone('')).toBe('');
  });
});

describe('stripMask', () => {
  it('should remove all non-digits', () => {
    expect(stripMask('(11) 98765-4321')).toBe('11987654321');
    expect(stripMask('R$ 1.234,56')).toBe('123456');
    expect(stripMask('abc123def456')).toBe('123456');
  });
});
