import { ThemeProvider } from './ThemeContext';
import { LanguageProvider, useLanguage } from './LanguageContext';
import { ErrorBoundary } from './ErrorBoundary';
import Dashboard from './Dashboard';
import Charts from './Charts';

function AppContent() {
  const { t } = useLanguage();
  return (
    <>
      <ErrorBoundary label={t.errors.dashboardUnavailable}>
        <Dashboard />
      </ErrorBoundary>
      <ErrorBoundary label={t.errors.chartsUnavailable}>
        <Charts />
      </ErrorBoundary>
    </>
  );
}

export default function AppShell() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  );
}
