import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock SweetAlert
global.Swal = {
  fire: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  showLoading: vi.fn(),
};

// Mock axios
vi.mock('axios', () => ({
  default: {
    defaults: { headers: { common: {} }, baseURL: '' },
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));
