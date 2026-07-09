# Sleep Environment Monitor

> A personal IoT system that tracks my bedroom's temperature, humidity, light, and noise in real-time — and scores how suitable the environment is for sleep.

![Dashboard screenshot](docs/screenshot.png)

---

## Why I built this

I was curious whether my room's conditions were actually affecting my sleep quality. Instead of buying a commercial sensor, I built one: an ESP32 reads four environmental variables every few seconds and streams them to a Go backend over MQTT. The backend scores the environment against research-backed thresholds and pushes updates to a React dashboard via Server-Sent Events.

---

## Architecture

```
┌─────────────┐     MQTT      ┌──────────────┐     SSE      ┌──────────────┐
│    ESP32    │ ───────────▶  │  Go Backend  │ ──────────▶  │    React     │
│  + sensors  │  tcp/:1883    │  + SQLite    │  /api/stream  │  Dashboard   │
└─────────────┘               └──────────────┘               └──────────────┘
                                     │
                               Mosquitto MQTT
                                   Broker
```

**Data flow:** The ESP32 publishes a JSON payload every 5 seconds to a Mosquitto broker. The Go backend subscribes to that topic, persists each reading to SQLite, calculates a sleep score, and fans it out to all connected browser clients over a persistent SSE connection.

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Firmware | C++ / Arduino (ESP32) | Native WiFi + sensor libraries |
| Message broker | Mosquitto (MQTT) | Lightweight pub/sub, perfect for IoT |
| Backend | Go | Single binary, low memory, great stdlib HTTP |
| Database | SQLite | Zero-ops, sufficient for single-user time-series |
| Frontend | Astro + React | Islands architecture — only hydrates interactive components |
| Charts | Recharts | Composable, works well with React |

---

## Sleep Score Algorithm

Each reading produces a score from 0–100 based on four indicators with independent weights:

| Indicator | Weight | Optimal range | Rationale |
|---|---|---|---|
| Temperature | 35% | 18–20 °C | Core body temp drops during deep sleep |
| Light | 30% | < 5% | Primary melatonin suppressor |
| Humidity | 20% | 40–60% | Respiratory comfort |
| Noise | 15% | < 20% | Reduced weight pending better mic hardware |

Each indicator is scored through three tiers (optimal → good → poor) using linear interpolation, so the score degrades smoothly rather than in steps. The weighted sum gives the final score.

---

## API

All endpoints return JSON with CORS enabled.

### `GET /api/stream`
Server-Sent Events stream. Emits a `data` event on every new reading. Sends the latest reading immediately on connect so the dashboard never starts blank.

```
data: {"reading": {...}, "score": {"total": 87.3, "temperature_score": 95, ...}}
```

### `GET /api/readings/latest`
Most recent reading with its sleep score.

### `GET /api/readings`
Paginated reading history. Supports optional time-range filtering.

| Param | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | 50 | Max results |
| `from` | RFC3339 | — | Range start |
| `to` | RFC3339 | — | Range end |

### `GET /api/readings/aggregate`
Time-bucketed averages for historical charts.

| Param | Type | Required | Description |
|---|---|---|---|
| `from` | RFC3339 | ✓ | Range start |
| `to` | RFC3339 | ✓ | Range end |
| `interval` | `minute` \| `hour` \| `day` | ✓ | Bucket size |

```bash
GET /api/readings/aggregate?from=2025-01-01T00:00:00Z&to=2025-01-02T00:00:00Z&interval=hour
```

---

## Quick Start (Docker)

```bash
git clone https://github.com/Kitatzu/sleep-monitor.git
cd sleep-monitor
docker compose up --build
```

| Service | URL |
|---|---|
| Dashboard | http://localhost:4321 |
| Backend API | http://localhost:8080 |
| MQTT Broker | mqtt://localhost:1883 |

Point your ESP32 to `mqtt://<your-machine-ip>:1883` and you're done.

---

## Local Development

### Backend

```bash
cd backend
go run .
```

Defaults to `tcp://localhost:1883` for MQTT and `sleep_monitor.db` for SQLite.

### Frontend

```bash
cd frontend
cp .env.example .env   # set PUBLIC_BACKEND_URL
pnpm install
pnpm dev               # http://localhost:4321
```

### MQTT Broker only

```bash
cd infra
docker compose up
```

---

## Environment Variables

### Backend

| Variable | Default | Description |
|---|---|---|
| `MQTT_BROKER` | `tcp://localhost:1883` | Mosquitto broker address |
| `DB_PATH` | `sleep_monitor.db` | SQLite file path |

### Frontend

| Variable | Required | Description |
|---|---|---|
| `PUBLIC_BACKEND_URL` | ✓ | Go backend base URL (e.g. `http://localhost:8080`) |

---

## Project Structure

```
sleep-monitor/
├── backend/            # Go server (MQTT consumer, REST API, SSE hub)
│   ├── internal/
│   │   ├── api/        # HTTP handlers and SSE hub
│   │   ├── models/     # SensorReading, AggregatedReading
│   │   ├── repository/ # SQLite implementation
│   │   └── scoring/    # Sleep score algorithm
│   └── main.go
├── frontend/           # Astro + React dashboard
│   └── src/
│       ├── components/ # Dashboard, Charts, ArcGauge, SensorCard
│       └── pages/
├── firmware/           # ESP32 Arduino sketch
├── infra/              # Mosquitto config
└── docker-compose.yml  # Full stack in one command
```

---

## Design decisions worth noting

**SSE over WebSockets** — the data flow is strictly unidirectional (server → browser), so SSE is a better fit. It runs over plain HTTP, works through proxies without configuration, and reconnects automatically on disconnect.

**SQLite over Postgres/Timescale** — this is a single-user system generating ~720 readings/hour. SQLite's `strftime()` handles time-bucketed aggregation efficiently and the whole thing runs without a separate database process.

**Go for the backend** — compiles to a single binary, starts in milliseconds, handles concurrent SSE connections well with goroutines, and MQTT + HTTP are first-class in its ecosystem.
