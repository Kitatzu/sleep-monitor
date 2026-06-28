package scoring

// Temperature thresholds (°C) — optimal range for deep sleep cycles
const (
	TempOptimalMin = 18.0
	TempOptimalMax = 20.0
	TempGoodMin    = 16.0
	TempGoodMax    = 22.0
	TempPoorMin    = 14.0
	TempPoorMax    = 24.0
)

// Humidity thresholds (%) — affects respiratory comfort
const (
	HumidityOptimalMin = 40.0
	HumidityOptimalMax = 60.0
	HumidityGoodMin    = 30.0
	HumidityGoodMax    = 70.0
	HumidityPoorMin    = 20.0
	HumidityPoorMax    = 80.0
)

// Light thresholds (%) — direct melatonin suppressor
const (
	LightOptimalMax = 5.0
	LightGoodMax    = 20.0
	LightPoorMax    = 40.0
)

// Noise thresholds (%) — weight reduced until MAX4466 arrives
const (
	NoiseOptimalMax = 20.0
	NoiseGoodMax    = 35.0
	NoisePoorMax    = 50.0
)

// Weights — must sum to 1.0
const (
	WeightTemperature = 0.35
	WeightLight       = 0.30
	WeightHumidity    = 0.20
	WeightNoise       = 0.15
)
