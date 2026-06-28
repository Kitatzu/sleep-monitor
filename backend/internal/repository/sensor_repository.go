package repository

import "sleep-monitor/backend/internal/models"

type SensorRepository interface {
	Save(reading models.SensorReading) error
	GetRecent(limit int) ([]models.SensorReading, error)
}
