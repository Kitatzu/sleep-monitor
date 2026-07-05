package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

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
	hub  *SSEHub
}

func NewHandler(repo repository.SensorRepository, hub *SSEHub) *Handler {
	return &Handler{repo: repo, hub: hub}
}

func (h *Handler) RegisterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/readings/latest", h.getLatest)
	mux.HandleFunc("GET /api/readings", h.getReadings)
	mux.HandleFunc("GET /api/stream", h.stream)
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
	respond(w, readingWithScore{Reading: reading, Score: scoring.Calculate(reading)})
}

func (h *Handler) getReadings(w http.ResponseWriter, r *http.Request) {
	limit := 50
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			limit = n
		}
	}

	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")

	var readings []models.SensorReading
	var err error

	if fromStr != "" || toStr != "" {
		from, errFrom := time.Parse(time.RFC3339, fromStr)
		to, errTo := time.Parse(time.RFC3339, toStr)
		if errFrom != nil || errTo != nil {
			http.Error(w, `invalid time format, expected RFC3339 (e.g. 2006-01-02T15:04:05Z)`, http.StatusBadRequest)
			return
		}
		readings, err = h.repo.GetByTimeRange(from, to, limit)
	} else {
		readings, err = h.repo.GetRecent(limit)
	}

	if err != nil {
		http.Error(w, "failed to fetch readings", http.StatusInternalServerError)
		return
	}

	result := make([]readingWithScore, len(readings))
	for i, reading := range readings {
		result[i] = readingWithScore{Reading: reading, Score: scoring.Calculate(reading)}
	}

	respond(w, result)
}

func (h *Handler) stream(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "streaming not supported", http.StatusInternalServerError)
		return
	}

	ch := h.hub.Subscribe()
	defer h.hub.Unsubscribe(ch)

	if latest, err := h.repo.GetRecent(1); err == nil && len(latest) > 0 {
		reading := latest[0]
		initialEvent, _ := json.Marshal(struct {
			Reading models.SensorReading `json:"reading"`
			Score   scoring.SleepScore   `json:"score"`
		}{Reading: reading, Score: scoring.Calculate(reading)})
		fmt.Fprintf(w, "data: %s\n\n", initialEvent)
		flusher.Flush()
	}

	for {
		select {
		case data := <-ch:
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		case <-r.Context().Done():
			return
		}
	}
}

func respond(w http.ResponseWriter, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(data)
}
