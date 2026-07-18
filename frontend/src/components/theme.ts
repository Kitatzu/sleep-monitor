export interface Theme {
  BG: string;
  SURFACE: string;
  SURFACE_RAISED: string;
  BORDER: string;
  TEXT: string;
  MUTED: string;
  ACCENT: string;
  FLASH_BG: string;
  FLASH_BORDER: string;
  FLASH_TEXT: string;
}

export const darkTheme: Theme = {
  BG: '#080d18',
  SURFACE: '#0f1729',
  SURFACE_RAISED: '#162035',
  BORDER: '#1e2d48',
  TEXT: '#dde4f0',
  MUTED: '#4d6480',
  ACCENT: '#6b8eff',
  FLASH_BG: '#1a2a3a',
  FLASH_BORDER: '#2d4a6a',
  FLASH_TEXT: '#a8c4f0',
};

export const lightTheme: Theme = {
  BG: '#f4f6fb',
  SURFACE: '#ffffff',
  SURFACE_RAISED: '#eaecf5',
  BORDER: '#d4d9ee',
  TEXT: '#1a2540',
  MUTED: '#6b7fa8',
  ACCENT: '#4a6cf7',
  FLASH_BG: '#e0e8ff',
  FLASH_BORDER: '#b0c0f0',
  FLASH_TEXT: '#2840a0',
};

export function scoreColor(score: number): string {
  if (score >= 80) return '#2dd4a0';
  if (score >= 50) return '#f5a623';
  return '#ff6b6b';
}

export function scoreLabel(score: number): string {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}
