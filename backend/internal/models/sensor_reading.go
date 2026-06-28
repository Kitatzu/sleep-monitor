package models

import "time"

type SensorReading struct {
	ID          int64     `json:"id,omitempty"`
	RecordedAt  time.Time `json:"recorded_at,omitempty"`
	Temperature float64   `json:"temperature"`
	Humidity    int       `json:"humidity"`
	LightLevel  int       `json:"light_level"`
	NoiseLevel  int       `json:"noise_level"`
}
