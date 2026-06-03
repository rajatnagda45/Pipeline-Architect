/**
 * SubmitButton.test.js — Integration test: SubmitButton + MSW API mocking.
 *
 * Tests the full request/response cycle without a real backend.
 * MSW intercepts fetch at the network layer — application code is unchanged.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { act } from 'react-dom/test-utils';

import { SubmitButton } from '../submit';
import { useStore } from '../store';

// ── MSW server ────────────────────────────────────────────────────────────────

const ENDPOINT = 'http://localhost:8000/pipelines/parse';

const server = setupServer(
  rest.post(ENDPOINT, (req, res, ctx) =>
    res(ctx.json({ num_nodes: 2, num_edges: 1, is_dag: true }))
  )
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  // Reset store so node/edge counts start fresh
  act(() => {
    useStore.setState({ nodes: [], edges: [], nodeIDs: {}, past: [], future: [] });
  });
});
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSubmitButton(onLog = jest.fn()) {
  return render(<SubmitButton onLog={onLog} />);
}

function clickSubmit() {
  fireEvent.click(screen.getByText(/Submit Pipeline/i));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SubmitButton — happy path', () => {
  it('renders the submit button', () => {
    renderSubmitButton();
    expect(screen.getByText(/Submit Pipeline/i)).toBeInTheDocument();
  });

  it('shows node and edge count in the button', () => {
    act(() => {
      useStore.setState({
        nodes: [{ id: 'a' }, { id: 'b' }],
        edges: [{ id: 'e1' }],
      });
    });
    renderSubmitButton();
    expect(screen.getByText(/2N/)).toBeInTheDocument();
    expect(screen.getByText(/1E/)).toBeInTheDocument();
  });

  it('shows "Analysis Complete" panel on success', async () => {
    renderSubmitButton();
    clickSubmit();
    await waitFor(() => expect(screen.getByText(/Analysis Complete/i)).toBeInTheDocument());
  });

  it('displays Valid DAG when is_dag is true', async () => {
    renderSubmitButton();
    clickSubmit();
    await waitFor(() => expect(screen.getByText(/Valid DAG/i)).toBeInTheDocument());
  });

  it('shows node and edge KPI values from server response', async () => {
    renderSubmitButton();
    clickSubmit();
    await waitFor(() => {
      expect(screen.getByText('02')).toBeInTheDocument(); // num_nodes padded
      expect(screen.getByText('01')).toBeInTheDocument(); // num_edges padded
    });
  });

  it('calls onLog with the success entry', async () => {
    const onLog = jest.fn();
    renderSubmitButton(onLog);
    clickSubmit();
    await waitFor(() => expect(onLog).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'success', is_dag: true })
    ));
  });

  it('closes the result panel when "Continue Editing" is clicked', async () => {
    renderSubmitButton();
    clickSubmit();
    await waitFor(() => screen.getByText(/Continue Editing/i));
    fireEvent.click(screen.getByText(/Continue Editing/i));
    await waitFor(() => expect(screen.queryByText(/Analysis Complete/i)).not.toBeInTheDocument());
  });
});

describe('SubmitButton — cycle detected', () => {
  it('shows Cycle badge when is_dag is false', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res, ctx) =>
        res(ctx.json({ num_nodes: 2, num_edges: 2, is_dag: false }))
      )
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() => expect(screen.getByText('Cycle')).toBeInTheDocument());
  });

  it('shows cycle warning message', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res, ctx) =>
        res(ctx.json({ num_nodes: 3, num_edges: 3, is_dag: false }))
      )
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() =>
      expect(screen.getByText(/Pipeline contains a cycle/i)).toBeInTheDocument()
    );
  });
});

describe('SubmitButton — error states', () => {
  it('shows Backend Unreachable on network failure', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res) => res.networkError('Connection refused'))
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() =>
      expect(screen.getByText(/Backend Unreachable/i)).toBeInTheDocument()
    );
  });

  it('shows uvicorn start command hint on network error', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res) => res.networkError('Connection refused'))
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() =>
      expect(screen.getByText(/uvicorn main:app --reload/i)).toBeInTheDocument()
    );
  });

  it('shows Request Rejected on 422 validation error', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res, ctx) => res(ctx.status(422)))
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() =>
      expect(screen.getByText(/Request Rejected/i)).toBeInTheDocument()
    );
  });

  it('shows Server Error on 500', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res, ctx) => res(ctx.status(500)))
    );
    renderSubmitButton();
    clickSubmit();
    await waitFor(() =>
      expect(screen.getByText(/Server Error/i)).toBeInTheDocument()
    );
  });

  it('calls onLog with error entry on failure', async () => {
    server.use(
      rest.post(ENDPOINT, (req, res) => res.networkError('fail'))
    );
    const onLog = jest.fn();
    renderSubmitButton(onLog);
    clickSubmit();
    await waitFor(() =>
      expect(onLog).toHaveBeenCalledWith(expect.objectContaining({ kind: 'error' }))
    );
  });
});
