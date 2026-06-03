import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelectField } from '../nodes/fields/SelectField';

const field = {
  name: 'method',
  label: 'Method',
  kind: 'select',
  default: 'GET',
  options: ['GET', 'POST', 'PUT', 'DELETE'],
};

describe('SelectField', () => {
  it('renders the label', () => {
    render(<SelectField field={field} value="GET" onChange={() => {}} />);
    expect(screen.getByText('Method')).toBeInTheDocument();
  });

  it('shows all options', () => {
    render(<SelectField field={field} value="GET" onChange={() => {}} />);
    ['GET', 'POST', 'PUT', 'DELETE'].forEach((opt) => {
      expect(screen.getByRole('option', { name: opt })).toBeInTheDocument();
    });
  });

  it('shows the controlled value as selected', () => {
    render(<SelectField field={field} value="POST" onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('POST');
  });

  it('falls back to field.default when value is undefined', () => {
    render(<SelectField field={field} value={undefined} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toHaveValue('GET');
  });

  it('calls onChange with the selected value', () => {
    const onChange = jest.fn();
    render(<SelectField field={field} value="GET" onChange={onChange} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'DELETE' } });
    expect(onChange).toHaveBeenCalledWith('DELETE');
  });
});
