package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

const topic = "sm/sensors"

type SensorReading struct {
	Temperature float64 `json:"temperature"`
	Humidity    int     `json:"humidity"`
	LightLevel  int     `json:"light_level"`
	NoiseLevel  int     `json:"noise_level"`
}

func onMessage(_ mqtt.Client, msg mqtt.Message) {
	var reading SensorReading
	if err := json.Unmarshal(msg.Payload(), &reading); err != nil {
		log.Printf("WARN: malformed payload skipped: %s — %v\n", msg.Payload(), err)
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

func main() {
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

	if token := client.Subscribe(topic, 1, onMessage); token.Wait() && token.Error() != nil {
		log.Fatalf("Failed to subscribe to %s: %v\n", topic, token.Error())
	}

	log.Printf("Subscribed to topic: %s — waiting for sensor data...\n", topic)

	select {}
}
