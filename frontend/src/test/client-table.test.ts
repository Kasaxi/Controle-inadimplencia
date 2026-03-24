import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  updateClient: vi.fn(),
}));

function displayCPF(val: string): string {
  const d = val?.replace(/\D/g, '') || '';
  if (d.length !== 11) return val;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function displayPhone(val: string): string {
  const d = val?.replace(/\D/g, '') || '';
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return val;
}

describe('ClientTable helpers', () => {
  describe('displayCPF', () => {
    it('should format 11-digit CPF correctly', () => {
      expect(displayCPF('12345678901')).toBe('123.456.789-01');
    });

    it('should return raw value if not 11 digits', () => {
      expect(displayCPF('1234567890')).toBe('1234567890');
      expect(displayCPF('123')).toBe('123');
      expect(displayCPF('')).toBe('');
    });

    it('should handle falsy values', () => {
      expect(displayCPF('')).toBe('');
      expect(displayCPF(null as unknown as string)).toBe('');
      expect(displayCPF(undefined as unknown as string)).toBe('');
    });
  });

  describe('displayPhone', () => {
    it('should format 11-digit phone correctly', () => {
      expect(displayPhone('11987654321')).toBe('(11) 98765-4321');
    });

    it('should format 10-digit phone correctly', () => {
      expect(displayPhone('1133334444')).toBe('(11) 3333-4444');
    });

    it('should return raw value for invalid length', () => {
      expect(displayPhone('123')).toBe('123');
      expect(displayPhone('')).toBe('');
    });
  });
});
