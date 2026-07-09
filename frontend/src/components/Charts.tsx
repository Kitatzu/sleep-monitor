import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BG, SURFACE, SURFACE_RAISED, BORDER, TEXT, MUTED } from './theme';

const BACKEND_URL = import.meta.env.PUBLIC_BACKEND_URL;

interface AggregatedReading {
  bucket: string;
  temperature: number;
  humidity: number;
  light_level: number;
  noise_level: number;
  count: number;
}

interface ChartDataPoint {
  formattedTime: string;
  temperature: number;
  humidity: number;
  lightLevel: number;
  noiseLevel: number;
}

type TimePreset = '1h' | '6h' | '24h' | '7d';
type AggregationInterval = 'minute' | 'hour';

interface PresetOption {
  label: string;
  value: TimePreset;
  hours: number;
  interval: AggregationInterval;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; color: string }>;
  label?: string;
  unit: string;
}

const TIME_PRESETS: PresetOption[] = [
  { label: '1H', value: '1h', hours: 1, interval: 'minute' },
  { label: '6H', value: '6h', hours: 6, interval: 'minute' },
  { label: '24H', value: '24h', hours: 24, interval: 'hour' },
  { label: '7D', value: '7d', hours: 168, interval: 'hour' },
];

const SENSOR_METRICS: Array<{
  key: keyof Omit<ChartDataPoint, 'formattedTime'>;
  label: string;
  unit: string;
  color: string;
}> = [
  { key: 'temperature', label: 'Temperature', unit: '°C', color: '#ff6b6b' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#6b8eff' },
  { key: 'lightLevel', label: 'Light Level', unit: '%', color: '#f5a623' },
  { key: 'noiseLevel', label: 'Noise Level', unit: '%', color: '#2dd4a0' },
];

function formatBucketTime(bucketString: string, preset: TimePreset): string {
  const date = new Date(bucketString);
  if (preset === '7d') {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function toChartDataPoints(
  readings: AggregatedReading[],
  preset: TimePreset
): ChartDataPoint[] {
  return readings
    .slice()
    .reverse()
    .map((reading) => ({
      formattedTime: formatBucketTime(reading.bucket, preset),
      temperature: Math.round(reading.temperature * 10) / 10,
      humidity: Math.round(reading.humidity * 10) / 10,
      lightLevel: Math.round(reading.light_level * 10) / 10,
      noiseLevel: Math.round(reading.noise_level * 10) / 10,
    }));
}

function ChartTooltip({ active, payload, label, unit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: SURFACE_RAISED,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.5rem',
        padding: '0.4rem 0.65rem',
        fontSize: '0.72rem',
        color: TEXT,
        pointerEvents: 'none',
      }}
    >
      <p
        style={{
          color: MUTED,
          marginBottom: '0.15rem',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: payload[0].color,
          fontVariantNumeric: 'tabular-nums',
          fontWeight: 600,
        }}
      >
        {payload[0].value} {unit}
      </p>
    </div>
  );
}

export default function Charts() {
  const [selectedPreset, setSelectedPreset] = useState<TimePreset>('1h');
  const [chartDataPoints, setChartDataPoints] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const presetOption = TIME_PRESETS.find(
      (option) => option.value === selectedPreset
    )!;
    const toDate = new Date();
    const fromDate = new Date(
      toDate.getTime() - presetOption.hours * 60 * 60 * 1000
    );

    const requestUrl = new URL(`${BACKEND_URL}/api/readings/aggregate`);
    requestUrl.searchParams.set('from', fromDate.toISOString());
    requestUrl.searchParams.set('to', toDate.toISOString());
    requestUrl.searchParams.set('interval', presetOption.interval);

    setLoading(true);
    fetch(requestUrl.toString())
      .then((response) => response.json())
      .then((readings: AggregatedReading[] | null) => {
        setChartDataPoints(toChartDataPoints(readings ?? [], selectedPreset));
      })
      .finally(() => setLoading(false));
  }, [selectedPreset]);

  return (
    <div
      style={{
        background: BG,
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        paddingTop: '0.5rem',
        color: TEXT,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <h2
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: MUTED,
            }}
          >
            Historical Trends
          </h2>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {TIME_PRESETS.map((presetOption) => (
              <button
                key={presetOption.value}
                onClick={() => setSelectedPreset(presetOption.value)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '0.375rem',
                  border: `1px solid ${selectedPreset === presetOption.value ? MUTED : BORDER}`,
                  background:
                    selectedPreset === presetOption.value
                      ? SURFACE_RAISED
                      : 'transparent',
                  color: selectedPreset === presetOption.value ? TEXT : MUTED,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {presetOption.label}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '0.875rem',
            opacity: loading ? 0.4 : 1,
            transition: 'opacity 0.2s ease',
          }}
        >
          {SENSOR_METRICS.map((metric) => (
            <div
              key={metric.key}
              style={{
                background: SURFACE,
                border: `1px solid ${BORDER}`,
                borderRadius: '0.75rem',
                padding: '1rem 1rem 0.5rem',
              }}
            >
              <p
                style={{
                  fontSize: '0.65rem',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: MUTED,
                  marginBottom: '0.75rem',
                }}
              >
                {metric.label}
              </p>
              <ResponsiveContainer width="100%" height={110}>
                <LineChart
                  data={chartDataPoints}
                  margin={{ top: 2, right: 4, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={BORDER}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="formattedTime"
                    tick={{ fontSize: 9, fill: MUTED }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: MUTED }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    content={<ChartTooltip unit={metric.unit} />}
                    cursor={{ stroke: BORDER, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: metric.color }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
