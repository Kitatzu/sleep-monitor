export type Language = 'en' | 'es';

export const translations = {
  en: {
    app: {
      title: 'Sleep Environment Monitor',
      lastUpdate: 'Last update',
    },
    connection: {
      waitingForData: 'CONNECTED — WAITING FOR DATA',
      connecting: 'CONNECTING TO BACKEND',
      live: 'LIVE',
      offline: 'OFFLINE',
    },
    theme: {
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
    },
    language: {
      switchTo: 'ES',
    },
    sensors: {
      temperature: 'Temperature',
      humidity: 'Humidity',
      lightLevel: 'Light Level',
      noiseLevel: 'Noise Level',
    },
    idealRanges: {
      temperature: 'Ideal: 16–19 °C',
      humidity: 'Ideal: 40–60 %',
      light: 'Ideal: < 5 %',
      noise: 'Ideal: < 30 %',
    },
    scores: {
      poor: 'POOR',
      fair: 'FAIR',
      good: 'GOOD',
      excellent: 'EXCELLENT',
      subLabels: {
        temp: 'TEMP',
        hum: 'HUM',
        light: 'LIGHT',
        noise: 'NOISE',
      },
    },
    charts: {
      title: 'Historical Trends',
    },
    errors: {
      dashboardUnavailable: 'Dashboard unavailable',
      chartsUnavailable: 'Charts unavailable',
      somethingWentWrong: 'Something went wrong',
      retry: 'Retry',
    },
  },
  es: {
    app: {
      title: 'Monitor de Ambiente de Sueño',
      lastUpdate: 'Última actualización',
    },
    connection: {
      waitingForData: 'CONECTADO — ESPERANDO DATOS',
      connecting: 'CONECTANDO AL BACKEND',
      live: 'EN VIVO',
      offline: 'DESCONECTADO',
    },
    theme: {
      switchToLight: 'Cambiar a modo claro',
      switchToDark: 'Cambiar a modo oscuro',
    },
    language: {
      switchTo: 'EN',
    },
    sensors: {
      temperature: 'Temperatura',
      humidity: 'Humedad',
      lightLevel: 'Nivel de Luz',
      noiseLevel: 'Nivel de Ruido',
    },
    idealRanges: {
      temperature: 'Ideal: 16–19 °C',
      humidity: 'Ideal: 40–60 %',
      light: 'Ideal: < 5 %',
      noise: 'Ideal: < 30 %',
    },
    scores: {
      poor: 'MALO',
      fair: 'REGULAR',
      good: 'BUENO',
      excellent: 'EXCELENTE',
      subLabels: {
        temp: 'TEMP',
        hum: 'HUM',
        light: 'LUZ',
        noise: 'RUIDO',
      },
    },
    charts: {
      title: 'Tendencias Históricas',
    },
    errors: {
      dashboardUnavailable: 'Panel no disponible',
      chartsUnavailable: 'Gráficos no disponibles',
      somethingWentWrong: 'Algo salió mal',
      retry: 'Reintentar',
    },
  },
} as const;

export type Translations = (typeof translations)['en'];

export function getScoreLabel(score: number, t: Translations): string {
  if (score >= 80) return t.scores.excellent;
  if (score >= 60) return t.scores.good;
  if (score >= 40) return t.scores.fair;
  return t.scores.poor;
}
