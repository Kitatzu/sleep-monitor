package repository

import (
	"time"

	"sleep-monitor/backend/internal/models"
)

type SensorRepository interface {
	Save(reading models.SensorReading) error
	GetRecent(limit int) ([]models.SensorReading, error)
	GetByTimeRange(from, to time.Time, limit int) ([]models.SensorReading, error)
	GetAggregated(from, to time.Time, interval string) ([]models.AggregatedReading, error)
}
