import { useState, useEffect, useRef } from 'react';

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

const BACKEND_URL = 'http://localhost:8080';

const BG = '#080d18';
const SURFACE = '#0f1729';
const SURFACE_RAISED = '#162035';
const BORDER = '#1e2d48';
const TEXT = '#dde4f0';
const MUTED = '#4d6480';
const ACCENT = '#6b8eff';

function scoreColor(score: number): string {
  if (score >= 80) return '#2dd4a0';
  if (score >= 50) return '#f5a623';
  return '#ff6b6b';
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}

function ArcGauge({ score }: { score: number }) {
  const color = scoreColor(score);
  const radius = 78;
  const centerX = 100;
  const centerY = 96;

  const angleDeg = 180 - (score / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const arcEndX = centerX + radius * Math.cos(angleRad);
  const arcEndY = centerY - radius * Math.sin(angleRad);

  const trackPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`;
  const fillPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${arcEndX.toFixed(1)} ${arcEndY.toFixed(1)}`;

  return (
    <svg viewBox="0 0 200 110" width="100%" style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}>
      <defs>
        <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path d={trackPath} fill="none" stroke={BORDER} strokeWidth="8" strokeLinecap="round" />

      {/* Glow layer */}
      {score > 1 && (
        <path d={fillPath} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" opacity="0.18" />
      )}

      {/* Fill */}
      {score > 1 && (
        <path d={fillPath} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" filter="url(#arc-glow)" />
      )}

      {/* Score number */}
      <text
        x={centerX} y={centerY - 6}
        textAnchor="middle"
        fill={color}
        fontSize="46"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {score}
      </text>

      {/* Quality label */}
      <text
        x={centerX} y={centerY + 13}
        textAnchor="middle"
        fill={MUTED}
        fontSize="9"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing="0.14em"
      >
        {scoreLabel(score)}
      </text>
    </svg>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ flex: 1, height: '3px', background: BORDER, borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          background: color,
          borderRadius: '2px',
          transition: 'width 0.6s ease',
        }} />
      </div>
      <span style={{
        fontSize: '0.75rem',
        fontVariantNumeric: 'tabular-nums',
        color,
        minWidth: '2rem',
        textAlign: 'right',
      }}>
        {score}
      </span>
    </div>
  );
}

type IconType = 'temperature' | 'humidity' | 'light' | 'noise';

function Icon({ type }: { type: IconType }) {
  const base = {
    width: 15,
    height: 15,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  if (type === 'temperature') return (
    <svg {...base}><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" /></svg>
  );
  if (type === 'humidity') return (
    <svg {...base}><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
  );
  if (type === 'light') return (
    <svg {...base}>
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
  return (
    <svg {...base}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}

function SensorCard({ label, value, unit, score, iconType }: {
  label: string;
  value: number;
  unit: string;
  score: number;
  iconType: IconType;
}) {
  const [flashing, setFlashing] = useState(false);
  const previousValue = useRef<number | null>(null);

  useEffect(() => {
    const previous = previousValue.current;
    previousValue.current = value;
    if (previous !== null && previous !== value) {
      setFlashing(true);
      const timeout = setTimeout(() => setFlashing(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [value]);

  return (
    <div style={{
      background: flashing ? '#1a2a3a' : SURFACE_RAISED,
      borderRadius: '0.75rem',
      padding: '1.25rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.875rem',
      border: `1px solid ${flashing ? '#2d4a6a' : BORDER}`,
      transition: 'background 0.4s ease, border-color 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: MUTED }}>
        <Icon type={iconType} />
        <span style={{ fontSize: '0.7rem', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <div style={{ lineHeight: 1 }}>
        <span style={{
          fontSize: '2.25rem',
          fontWeight: 700,
          color: flashing ? '#a8c4f0' : TEXT,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          transition: 'color 0.4s ease',
        }}>
          {value}
        </span>
        <span style={{ fontSize: '1rem', fontWeight: 400, color: MUTED, marginLeft: '0.2em' }}>
          {unit}
        </span>
      </div>
      <ScoreBar score={score} />
    </div>
  );
}

export default function Dashboard() {
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
        <div style={{
          minHeight: '100vh',
          background: BG,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: `2px solid ${BORDER}`,
            borderTopColor: connected ? '#2dd4a0' : ACCENT,
            animation: 'spin 0.9s linear infinite',
          }} />
          <p style={{ fontSize: '0.8rem', color: MUTED, letterSpacing: '0.06em' }}>
            {connected ? 'CONNECTED — WAITING FOR DATA' : 'CONNECTING TO BACKEND'}
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
      <div style={{
        minHeight: '100vh',
        background: BG,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        color: TEXT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <h1 style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
                Sleep Environment Monitor
              </h1>
              <p style={{ fontSize: '0.7rem', color: MUTED, opacity: 0.5, fontVariantNumeric: 'tabular-nums' }}>
                {updatedAt
                  ? updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : new Date(reading.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
              </p>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.7rem',
              padding: '0.25rem 0.6rem',
              borderRadius: '9999px',
              border: `1px solid ${connected ? '#1b3d2d' : '#3d1b1b'}`,
              color: connected ? '#2dd4a0' : '#ff6b6b',
              background: connected ? 'rgba(45,212,160,0.05)' : 'rgba(255,107,107,0.05)',
              letterSpacing: '0.06em',
            }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: connected ? '#2dd4a0' : '#ff6b6b',
                display: 'inline-block',
                animation: connected ? 'pulse 2s ease-in-out infinite' : 'none',
              }} />
              {connected ? 'LIVE' : 'OFFLINE'}
            </div>
          </div>

          {/* Arc gauge */}
          <div style={{
            background: SURFACE,
            borderRadius: '1rem',
            padding: '1.75rem 1.5rem 1rem',
            border: `1px solid ${BORDER}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            <ArcGauge score={score.total} />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: 280,
              marginTop: '0.5rem',
            }}>
              <span style={{ fontSize: '0.6rem', color: MUTED, opacity: 0.5, letterSpacing: '0.08em' }}>POOR</span>
              <span style={{ fontSize: '0.6rem', color: MUTED, opacity: 0.5, letterSpacing: '0.08em' }}>SLEEP SCORE</span>
              <span style={{ fontSize: '0.6rem', color: MUTED, opacity: 0.5, letterSpacing: '0.08em' }}>EXCELLENT</span>
            </div>
          </div>

          {/* Sensor grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
            <SensorCard label="Temperature" value={reading.temperature} unit="°C" score={score.temperature_score} iconType="temperature" />
            <SensorCard label="Humidity" value={reading.humidity} unit="%" score={score.humidity_score} iconType="humidity" />
            <SensorCard label="Light Level" value={reading.light_level} unit="%" score={score.light_score} iconType="light" />
            <SensorCard label="Noise Level" value={reading.noise_level} unit="%" score={score.noise_score} iconType="noise" />
          </div>

        </div>
      </div>
    </>
  );
}
