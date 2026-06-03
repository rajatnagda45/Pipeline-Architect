import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextField } from '../nodes/fields/TextField';

const field = { name: 'inputName', label: 'Name', kind: 'text', default: 'input' };

describe('TextField', () => {
  it('renders the field label', () => {
    render(<TextField field={field} value="" onChange={() => {}} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('shows the controlled value', () => {
    render(<TextField field={field} value="my-value" onChange={() => {}} />);
    expect(screen.getByDisplayValue('my-value')).toBeInTheDocument();
  });

  it('falls back to field.default when value is undefined', () => {
    render(<TextField field={field} value={undefined} onChange={() => {}} />);
    expect(screen.getByDisplayValue('input')).toBeInTheDocument();
  });

  it('falls back to empty string when value and default are both undefined', () => {
    const noDefault = { name: 'x', label: 'X', kind: 'text' };
    render(<TextField field={noDefault} value={undefined} onChange={() => {}} />);
    // input renders with empty string — no "uncontrolled" warning
    expect(screen.getByRole('textbox')).toHaveValue('');
  });

  it('calls onChange with new value on input', () => {
    const onChange = jest.fn();
    render(<TextField field={field} value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('is disabled when disabled prop is true', () => {
    render(<TextField field={field} value="" onChange={() => {}} disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<TextField field={field} value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeEnabled();
  });
});
