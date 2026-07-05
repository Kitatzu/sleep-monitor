export const BG = '#080d18';
export const SURFACE = '#0f1729';
export const SURFACE_RAISED = '#162035';
export const BORDER = '#1e2d48';
export const TEXT = '#dde4f0';
export const MUTED = '#4d6480';
export const ACCENT = '#6b8eff';

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
