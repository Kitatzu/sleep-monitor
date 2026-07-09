import { Component, type ReactNode } from 'react';
import { BG, SURFACE, BORDER, TEXT, MUTED } from './theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '12rem',
            background: BG,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '2rem',
            border: `1px solid ${BORDER}`,
            borderRadius: '0.75rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <p
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#ff6b6b',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {this.props.label ?? 'Something went wrong'}
          </p>
          <p
            style={{
              fontSize: '0.7rem',
              color: MUTED,
              maxWidth: '28rem',
              textAlign: 'center',
            }}
          >
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: '0.5rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '0.375rem',
              border: `1px solid ${BORDER}`,
              background: SURFACE,
              color: TEXT,
              fontSize: '0.7rem',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
