#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>
#include "secrets.h"

// --- Hardware Configuration ---
#define PIN_LDR  2
#define PIN_DHT  5
#define DHT_TYPE DHT11

// --- Calibration & Timing ---
const int LDR_FLOOR      = 15;
const int LDR_CEIL       = 1500;
const int DHT_TICK_MS    = 2500;

// --- Global Objects & State ---
DHT         dht(PIN_DHT, DHT_TYPE);
WiFiClient  wifiClient;
PubSubClient mqttClient(wifiClient);

unsigned long lastDhtRead = 0;
float currentTemp = 0;
float currentHum  = 0;

// --- Prototypes ---
int  readLightPercentage();
void broadcastData(float t, float h, int l);
void connectWiFi();
void connectMQTT();
void ensureConnections();

void setup() {
    Serial.begin(115200);
    dht.begin();
    analogSetAttenuation(ADC_11db);

    connectWiFi();

    mqttClient.setServer(MQTT_BROKER_IP, MQTT_BROKER_PORT);
    connectMQTT();

    Serial.println("{\"status\": \"Climate_Light_Node_Ready\"}");
}

void loop() {
    ensureConnections();
    mqttClient.loop();

    if (millis() - lastDhtRead >= DHT_TICK_MS) {
        float h     = dht.readHumidity();
        float t     = dht.readTemperature();
        int   light = readLightPercentage();

        if (isnan(h) || isnan(t)) {
            Serial.println("{\"error\": \"DHT_Sensor_Communication_Failed\"}");
        } else {
            currentTemp = t;
            currentHum  = h;
            broadcastData(currentTemp, currentHum, light);
        }

        lastDhtRead = millis();
    }
}

void connectWiFi() {
    Serial.printf("Connecting to WiFi: %s", WIFI_SSID);
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.printf("\nWiFi connected — IP: %s\n", WiFi.localIP().toString().c_str());
}

void connectMQTT() {
    while (!mqttClient.connected()) {
        Serial.print("Connecting to MQTT broker...");

        if (mqttClient.connect(MQTT_CLIENT_ID)) {
            Serial.println(" connected.");
        } else {
            Serial.printf(" failed (state=%d). Retrying in 3s\n", mqttClient.state());
            delay(3000);
        }
    }
}

// Reconnects WiFi and MQTT if either drops.
void ensureConnections() {
    if (WiFi.status() != WL_CONNECTED) {
        connectWiFi();
    }
    if (!mqttClient.connected()) {
        connectMQTT();
    }
}

int readLightPercentage() {
    int raw        = analogRead(PIN_LDR);
    int percentage = map(raw, LDR_FLOOR, LDR_CEIL, 0, 100);
    return constrain(percentage, 0, 100);
}

void broadcastData(float t, float h, int l) {
    JsonDocument doc;
    doc["temperature"] = t;
    doc["humidity"]    = (int)h;
    doc["light_level"] = l;
    doc["noise_level"] = 0;

    char payload[128];
    serializeJson(doc, payload);

    mqttClient.publish(MQTT_TOPIC, payload);
}
