package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
	"sleep-monitor/backend/internal/models"
	"sleep-monitor/backend/internal/repository"
)

const topic = "sm/sensors"

func onMessage(repo repository.SensorRepository) mqtt.MessageHandler {
	return func(_ mqtt.Client, msg mqtt.Message) {
		var reading models.SensorReading
		if err := json.Unmarshal(msg.Payload(), &reading); err != nil {
			log.Printf("WARN: malformed payload skipped: %s — %v\n", msg.Payload(), err)
			return
		}

		if err := repo.Save(reading); err != nil {
			log.Printf("ERROR: failed to save reading: %v\n", err)
			return
		}

		fmt.Printf("[%s] Temp: %.1f°C | Humidity: %d%% | Light: %d%% | Noise: %d%%\n",
			time.Now().Format("15:04:05"),
			reading.Temperature,
			reading.Humidity,
			reading.LightLevel,
			reading.NoiseLevel,
		)
	}
}

func main() {
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "sleep_monitor.db"
	}

	repo, err := repository.NewSQLiteSensorRepository(dbPath)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v\n", err)
	}

	broker := os.Getenv("MQTT_BROKER")
	if broker == "" {
		broker = "tcp://localhost:1883"
	}

	opts := mqtt.NewClientOptions().AddBroker(broker)
	opts.SetClientID("sleep_monitor_server")
	opts.SetOnConnectHandler(func(_ mqtt.Client) {
		log.Printf("Connected to broker: %s\n", broker)
	})
	opts.SetConnectionLostHandler(func(_ mqtt.Client, err error) {
		log.Printf("Connection lost: %v\n", err)
	})

	client := mqtt.NewClient(opts)

	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to connect to broker: %v\n", token.Error())
	}

	if token := client.Subscribe(topic, 1, onMessage(repo)); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to subscribe to %s: %v\n", topic, token.Error())
	}

	log.Printf("Subscribed to topic: %s — waiting for sensor data...\n", topic)

	select {}
}
