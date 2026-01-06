import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the API used by Overview
vi.mock('./services/api', () => ({
  fetchHospitalEmergencies: async () => [{ id: 'e1', condition: 'Mock Condition' }]
}));

import Overview from './Overview';

describe('Overview', () => {
  it('renders a recent emergency from API', async () => {
    render(<Overview />);
    const el = await screen.findByText('Mock Condition');
    expect(el).toBeTruthy();
  });
});
