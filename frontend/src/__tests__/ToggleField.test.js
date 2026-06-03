import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleField } from '../nodes/fields/ToggleField';

const field = { name: 'streaming', label: 'Streaming', kind: 'toggle', default: false };

describe('ToggleField', () => {
  it('renders the label', () => {
    render(<ToggleField field={field} value={false} onChange={() => {}} />);
    expect(screen.getByText('Streaming')).toBeInTheDocument();
  });

  it('has role="switch"', () => {
    render(<ToggleField field={field} value={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('aria-checked is false when off', () => {
    render(<ToggleField field={field} value={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('aria-checked is true when on', () => {
    render(<ToggleField field={field} value={true} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with toggled value on click', () => {
    const onChange = jest.fn();
    render(<ToggleField field={field} value={false} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange flipping true → false', () => {
    const onChange = jest.fn();
    render(<ToggleField field={field} value={true} onChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('falls back to field.default when value is undefined', () => {
    render(<ToggleField field={field} value={undefined} onChange={() => {}} />);
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });
});
