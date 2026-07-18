import { useState, useEffect } from 'react';
import { ArcGauge } from './ArcGauge';
import { SensorCard } from './SensorCard';
import { useTheme } from './ThemeContext';

interface SensorReading {
  id: number;
  recorded_at: string;
  temperature: number;
  humidity: number;
  light_level: number;
  noise_level: number;
}

interface SleepScore {
  total: number;
  temperature_score: number;
  humidity_score: number;
  light_score: number;
  noise_score: number;
}

interface SensorData {
  reading: SensorReading;
  score: SleepScore;
}

const BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL;

function SunIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export default function Dashboard() {
  const { theme, isDark, toggle } = useTheme();
  const [data, setData] = useState<SensorData | null>(null);
  const [connected, setConnected] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  useEffect(() => {
    const es = new EventSource(`${BACKEND_URL}/api/stream`);
    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      setData(JSON.parse(event.data));
      setUpdatedAt(new Date());
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, []);

  if (!data) {
    return (
      <>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
        <div
          style={{
            minHeight: '80vh',
            background: theme.BG,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `2px solid ${theme.BORDER}`,
              borderTopColor: connected ? '#2dd4a0' : theme.ACCENT,
              animation: 'spin 0.9s linear infinite',
            }}
          />
          <p
            style={{
              fontSize: '0.8rem',
              color: theme.MUTED,
              letterSpacing: '0.06em',
            }}
          >
            {connected
              ? 'CONNECTED — WAITING FOR DATA'
              : 'CONNECTING TO BACKEND'}
          </p>
        </div>
      </>
    );
  }

  const { reading, score } = data;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
      <div
        style={{
          minHeight: '80vh',
          background: theme.BG,
          padding: 'clamp(1.5rem, 4vw, 2.5rem)',
          paddingBottom: '0.75rem',
          color: theme.TEXT,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          transition: 'background 0.3s ease, color 0.3s ease',
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem',
              }}
            >
              <h1
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: theme.MUTED,
                }}
              >
                Sleep Environment Monitor
              </h1>
              <p
                style={{
                  fontSize: '0.7rem',
                  color: theme.MUTED,
                  opacity: 0.5,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {updatedAt
                  ? updatedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : new Date(reading.recorded_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
              </p>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <button
                onClick={toggle}
                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: `1px solid ${theme.BORDER}`,
                  background: theme.SURFACE,
                  color: theme.MUTED,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isDark ? <SunIcon /> : <MoonIcon />}
              </button>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '9999px',
                  border: `1px solid ${connected ? '#1b3d2d' : '#3d1b1b'}`,
                  color: connected ? '#2dd4a0' : '#ff6b6b',
                  background: connected
                    ? 'rgba(45,212,160,0.05)'
                    : 'rgba(255,107,107,0.05)',
                  letterSpacing: '0.06em',
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: connected ? '#2dd4a0' : '#ff6b6b',
                    display: 'inline-block',
                    animation: connected
                      ? 'pulse 2s ease-in-out infinite'
                      : 'none',
                  }}
                />
                {connected ? 'LIVE' : 'OFFLINE'}
              </div>
            </div>
          </div>

          <div
            style={{
              background: theme.SURFACE,
              borderRadius: '1rem',
              padding: '1.75rem 1.5rem 1rem',
              border: `1px solid ${theme.BORDER}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <ArcGauge score={score.total} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: 280,
                marginTop: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.6rem',
                  color: theme.MUTED,
                  opacity: 0.5,
                  letterSpacing: '0.08em',
                }}
              >
                POOR
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: theme.MUTED,
                  opacity: 0.5,
                  letterSpacing: '0.08em',
                }}
              >
                SLEEP SCORE
              </span>
              <span
                style={{
                  fontSize: '0.6rem',
                  color: theme.MUTED,
                  opacity: 0.5,
                  letterSpacing: '0.08em',
                }}
              >
                EXCELLENT
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
              gap: '0.875rem',
            }}
          >
            <SensorCard
              label="Temperature"
              value={reading.temperature}
              unit="°C"
              score={score.temperature_score}
              iconType="temperature"
            />
            <SensorCard
              label="Humidity"
              value={reading.humidity}
              unit="%"
              score={score.humidity_score}
              iconType="humidity"
            />
            <SensorCard
              label="Light Level"
              value={reading.light_level}
              unit="%"
              score={score.light_score}
              iconType="light"
            />
            <SensorCard
              label="Noise Level"
              value={reading.noise_level}
              unit="%"
              score={score.noise_score}
              iconType="noise"
            />
          </div>
        </div>
      </div>
    </>
  );
}
