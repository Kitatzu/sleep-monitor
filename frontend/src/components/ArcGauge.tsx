import { BORDER, MUTED, scoreColor, scoreLabel } from './theme';

export function ArcGauge({ score }: { score: number }) {
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
    <svg
      viewBox="0 0 200 110"
      width="100%"
      style={{ maxWidth: 280, display: 'block', margin: '0 auto' }}
    >
      <defs>
        <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d={trackPath}
        fill="none"
        stroke={BORDER}
        strokeWidth="8"
        strokeLinecap="round"
      />

      {score > 1 && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.18"
        />
      )}
      {score > 1 && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          filter="url(#arc-glow)"
        />
      )}

      <text
        x={centerX}
        y={centerY - 6}
        textAnchor="middle"
        fill={color}
        fontSize="46"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {score}
      </text>

      <text
        x={centerX}
        y={centerY + 13}
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
