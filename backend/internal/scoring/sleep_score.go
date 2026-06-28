package scoring

import (
	"math"
	"sleep-monitor/backend/internal/models"
)

type SleepScore struct {
	Total       float64 `json:"total"`
	Temperature float64 `json:"temperature_score"`
	Humidity    float64 `json:"humidity_score"`
	Light       float64 `json:"light_score"`
	Noise       float64 `json:"noise_score"`
}

func Calculate(r models.SensorReading) SleepScore {
	tScore := rangeScore(r.Temperature, TempOptimalMin, TempOptimalMax, TempGoodMin, TempGoodMax, TempPoorMin, TempPoorMax)
	hScore := rangeScore(float64(r.Humidity), HumidityOptimalMin, HumidityOptimalMax, HumidityGoodMin, HumidityGoodMax, HumidityPoorMin, HumidityPoorMax)
	lScore := lowerIsBetterScore(float64(r.LightLevel), LightOptimalMax, LightGoodMax, LightPoorMax)
	nScore := lowerIsBetterScore(float64(r.NoiseLevel), NoiseOptimalMax, NoiseGoodMax, NoisePoorMax)

	total := tScore*WeightTemperature +
		hScore*WeightHumidity +
		lScore*WeightLight +
		nScore*WeightNoise

	return SleepScore{
		Total:       round(total),
		Temperature: round(tScore),
		Humidity:    round(hScore),
		Light:       round(lScore),
		Noise:       round(nScore),
	}
}

// rangeScore scores a value that has an optimal range.
// Returns 100 inside optimal, interpolates down to 60 in good range,
// interpolates down to 0 in poor range, and 0 outside.
func rangeScore(v, optMin, optMax, goodMin, goodMax, poorMin, poorMax float64) float64 {
	if v >= optMin && v <= optMax {
		return 100
	}
	if v >= goodMin && v < optMin {
		return lerp(v, goodMin, optMin, 60, 100)
	}
	if v > optMax && v <= goodMax {
		return lerp(v, optMax, goodMax, 100, 60)
	}
	if v >= poorMin && v < goodMin {
		return lerp(v, poorMin, goodMin, 0, 60)
	}
	if v > goodMax && v <= poorMax {
		return lerp(v, goodMax, poorMax, 60, 0)
	}
	return 0
}

// lowerIsBetterScore scores a value where lower is always better (light, noise).
// Returns 100 at or below optimal, interpolates down to 60 at good, 0 at poor.
func lowerIsBetterScore(v, optMax, goodMax, poorMax float64) float64 {
	if v <= optMax {
		return 100
	}
	if v <= goodMax {
		return lerp(v, optMax, goodMax, 100, 60)
	}
	if v <= poorMax {
		return lerp(v, goodMax, poorMax, 60, 0)
	}
	return 0
}

func lerp(v, inMin, inMax, outMin, outMax float64) float64 {
	return outMin + (v-inMin)/(inMax-inMin)*(outMax-outMin)
}

func round(v float64) float64 {
	return math.Round(v*10) / 10
}
