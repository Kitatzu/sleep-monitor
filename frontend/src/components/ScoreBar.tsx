import { useTheme } from './ThemeContext';
import { scoreColor } from './theme';

export function ScoreBar({ score }: { score: number }) {
  const { theme } = useTheme();
  const color = scoreColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div
        style={{
          flex: 1,
          height: '3px',
          background: theme.BORDER,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: '2px',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '0.75rem',
          fontVariantNumeric: 'tabular-nums',
          color,
          minWidth: '2rem',
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}
