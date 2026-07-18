import { Component, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import { LanguageContext } from './LanguageContext';

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
  static contextType = ThemeContext;
  declare context: React.ContextType<typeof ThemeContext>;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  render() {
    const { theme } = this.context;

    if (this.state.error) {
      const capturedError = this.state.error;
      return (
        <LanguageContext.Consumer>
          {({ t }) => (
            <div
              style={{
                minHeight: '12rem',
                background: theme.BG,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '2rem',
                border: `1px solid ${theme.BORDER}`,
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
                {this.props.label ?? t.errors.somethingWentWrong}
              </p>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: theme.MUTED,
                  maxWidth: '28rem',
                  textAlign: 'center',
                }}
              >
                {capturedError.message}
              </p>
              <button
                onClick={() => this.setState({ error: null })}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${theme.BORDER}`,
                  background: theme.SURFACE,
                  color: theme.TEXT,
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {t.errors.retry}
              </button>
            </div>
          )}
        </LanguageContext.Consumer>
      );
    }

    return this.props.children;
  }
}
