import { render, screen } from '@testing-library/react';
import App from './App';
import { it, expect } from 'vitest';

it('renders Karjat Properties login page by default', () => {
  render(<App />);
  expect(screen.getAllByText('Karjat Properties').length).toBeGreaterThan(0);
});
