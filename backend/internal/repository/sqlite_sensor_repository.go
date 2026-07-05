package repository

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
	"sleep-monitor/backend/internal/models"
)

type SQLiteSensorRepository struct {
	db *sql.DB
}

func NewSQLiteSensorRepository(path string) (*SQLiteSensorRepository, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, fmt.Errorf("opening database: %w", err)
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("running migrations: %w", err)
	}

	return &SQLiteSensorRepository{db: db}, nil
}

func (r *SQLiteSensorRepository) Save(reading models.SensorReading) error {
	_, err := r.db.Exec(
		`INSERT INTO sensor_readings (temperature, humidity, light_level, noise_level)
		 VALUES (?, ?, ?, ?)`,
		reading.Temperature,
		reading.Humidity,
		reading.LightLevel,
		reading.NoiseLevel,
	)
	return err
}

func (r *SQLiteSensorRepository) GetRecent(limit int) ([]models.SensorReading, error) {
	rows, err := r.db.Query(
		`SELECT id, recorded_at, temperature, humidity, light_level, noise_level
		 FROM sensor_readings
		 ORDER BY recorded_at DESC
		 LIMIT ?`,
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReadings(rows)
}

func (r *SQLiteSensorRepository) GetByTimeRange(from, to time.Time, limit int) ([]models.SensorReading, error) {
	const sqliteTimeFormat = "2006-01-02 15:04:05"
	rows, err := r.db.Query(
		`SELECT id, recorded_at, temperature, humidity, light_level, noise_level
		 FROM sensor_readings
		 WHERE recorded_at BETWEEN ? AND ?
		 ORDER BY recorded_at DESC
		 LIMIT ?`,
		from.UTC().Format(sqliteTimeFormat),
		to.UTC().Format(sqliteTimeFormat),
		limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanReadings(rows)
}

var intervalStrftimeFormats = map[string]string{
	"minute": "%Y-%m-%d %H:%M",
	"hour":   "%Y-%m-%d %H",
	"day":    "%Y-%m-%d",
}

var intervalParseFormats = map[string]string{
	"minute": "2006-01-02 15:04",
	"hour":   "2006-01-02 15",
	"day":    "2006-01-02",
}

func (r *SQLiteSensorRepository) GetAggregated(from, to time.Time, interval string) ([]models.AggregatedReading, error) {
	const sqliteTimeFormat = "2006-01-02 15:04:05"

	strftimeFmt, ok := intervalStrftimeFormats[interval]
	if !ok {
		return nil, fmt.Errorf("invalid interval %q: must be minute, hour, or day", interval)
	}
	parseFmt := intervalParseFormats[interval]

	rows, err := r.db.Query(
		`SELECT
			strftime(?, recorded_at) AS bucket,
			AVG(temperature),
			AVG(humidity),
			AVG(light_level),
			AVG(noise_level),
			COUNT(*)
		 FROM sensor_readings
		 WHERE recorded_at BETWEEN ? AND ?
		 GROUP BY bucket
		 ORDER BY bucket DESC`,
		strftimeFmt,
		from.UTC().Format(sqliteTimeFormat),
		to.UTC().Format(sqliteTimeFormat),
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []models.AggregatedReading
	for rows.Next() {
		var bucketStr string
		var agg models.AggregatedReading
		if err := rows.Scan(&bucketStr, &agg.Temperature, &agg.Humidity, &agg.LightLevel, &agg.NoiseLevel, &agg.Count); err != nil {
			return nil, err
		}
		agg.Bucket, err = time.ParseInLocation(parseFmt, bucketStr, time.UTC)
		if err != nil {
			return nil, fmt.Errorf("parsing bucket %q: %w", bucketStr, err)
		}
		results = append(results, agg)
	}
	return results, rows.Err()
}

func scanReadings(rows *sql.Rows) ([]models.SensorReading, error) {
	var readings []models.SensorReading
	for rows.Next() {
		var reading models.SensorReading
		if err := rows.Scan(&reading.ID, &reading.RecordedAt, &reading.Temperature, &reading.Humidity, &reading.LightLevel, &reading.NoiseLevel); err != nil {
			return nil, err
		}
		readings = append(readings, reading)
	}
	return readings, rows.Err()
}

func migrate(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS sensor_readings (
			id          INTEGER PRIMARY KEY AUTOINCREMENT,
			recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			temperature REAL    NOT NULL,
			humidity    INTEGER NOT NULL,
			light_level INTEGER NOT NULL,
			noise_level INTEGER NOT NULL
		)
	`)
	return err
}
