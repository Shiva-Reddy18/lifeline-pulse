import { describe, it, expect } from 'vitest';
import { maskPatientId } from './helpers';

describe('maskPatientId', () => {
  it('masks a patient id preserving start and end', () => {
    expect(maskPatientId('patient-12345')).toBe('pat***45');
  });

  it('handles short ids gracefully', () => {
    expect(maskPatientId('ab')).toBe('ab');
  });
});
