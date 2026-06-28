package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"sleep-monitor/backend/internal/models"
	"sleep-monitor/backend/internal/repository"
	"sleep-monitor/backend/internal/scoring"
)

type readingWithScore struct {
	Reading models.SensorReading `json:"reading"`
	Score   scoring.SleepScore   `json:"score"`
}

type Handler struct {
	repo repository.SensorRepository
}

func NewHandler(repo repository.SensorRepository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/readings/latest", h.getLatest)
	mux.HandleFunc("GET /api/readings", h.getReadings)
}

func (h *Handler) getLatest(w http.ResponseWriter, r *http.Request) {
	readings, err := h.repo.GetRecent(1)
	if err != nil {
		http.Error(w, "failed to fetch reading", http.StatusInternalServerError)
		return
	}

	if len(readings) == 0 {
		http.Error(w, "no readings yet", http.StatusNotFound)
		return
	}

	reading := readings[0]
	respond(w, readingWithScore{
		Reading: reading,
		Score:   scoring.Calculate(reading),
	})
}

func (h *Handler) getReadings(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			limit = n
		}
	}

	readings, err := h.repo.GetRecent(limit)
	if err != nil {
		http.Error(w, "failed to fetch readings", http.StatusInternalServerError)
		return
	}

	result := make([]readingWithScore, len(readings))
	for i, reading := range readings {
		result[i] = readingWithScore{
			Reading: reading,
			Score:   scoring.Calculate(reading),
		}
	}

	respond(w, result)
}

func respond(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
