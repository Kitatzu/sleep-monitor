import { ThemeProvider } from './ThemeContext';
import { ErrorBoundary } from './ErrorBoundary';
import Dashboard from './Dashboard';
import Charts from './Charts';

export default function AppShell() {
  return (
    <ThemeProvider>
      <ErrorBoundary label="Dashboard unavailable">
        <Dashboard />
      </ErrorBoundary>
      <ErrorBoundary label="Charts unavailable">
        <Charts />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
