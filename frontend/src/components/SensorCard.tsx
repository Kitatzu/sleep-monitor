import { useState, useEffect, useRef } from 'react';
import { ScoreBar } from './ScoreBar';
import { useTheme } from './ThemeContext';
import { scoreColor } from './theme';

export type IconType = 'temperature' | 'humidity' | 'light' | 'noise';

const IDEAL_RANGES: Record<IconType, string> = {
  temperature: 'Ideal: 16–19 °C',
  humidity: 'Ideal: 40–60 %',
  light: 'Ideal: < 5 %',
  noise: 'Ideal: < 30 %',
};

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
  if (type === 'temperature')
    return (
      <svg {...base}>
        <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
      </svg>
    );
  if (type === 'humidity')
    return (
      <svg {...base}>
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
      </svg>
    );
  if (type === 'light')
    return (
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

interface SensorCardProps {
  label: string;
  value: number;
  unit: string;
  score: number;
  iconType: IconType;
}

export function SensorCard({
  label,
  value,
  unit,
  score,
  iconType,
}: SensorCardProps) {
  const { theme } = useTheme();
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

  const accentColor = flashing ? theme.FLASH_BORDER : scoreColor(score);

  return (
    <div
      style={{
        background: flashing ? theme.FLASH_BG : theme.SURFACE_RAISED,
        borderRadius: '0.75rem',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        border: `1px solid ${flashing ? theme.FLASH_BORDER : theme.BORDER}`,
        borderLeft: `3px solid ${accentColor}`,
        transition: 'background 0.4s ease, border-color 0.4s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
        <span
          style={{ color: flashing ? theme.FLASH_TEXT : scoreColor(score) }}
        >
          <Icon type={iconType} />
        </span>
        <span
          style={{
            fontSize: '0.7rem',
            letterSpacing: '0.09em',
            textTransform: 'uppercase',
            color: theme.MUTED,
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            color: flashing ? theme.FLASH_TEXT : theme.TEXT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em',
            transition: 'color 0.4s ease',
          }}
        >
          {value}
        </span>
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 400,
            color: theme.MUTED,
            marginLeft: '0.2em',
          }}
        >
          {unit}
        </span>
      </div>
      <ScoreBar score={score} />
      <p
        style={{
          fontSize: '0.6rem',
          color: theme.MUTED,
          opacity: 0.5,
          letterSpacing: '0.06em',
          marginTop: '-0.35rem',
        }}
      >
        {IDEAL_RANGES[iconType]}
      </p>
    </div>
  );
}
