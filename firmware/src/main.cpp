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
const int           LDR_FLOOR            = 15;
const int           LDR_CEIL             = 1500;
const unsigned long DHT_INTERVAL         = 2500;
const unsigned long WIFI_RETRY_INTERVAL  = 500;
const unsigned long MQTT_RETRY_INTERVAL  = 3000;
const int           SENSOR_ERROR_MAX     = 5;

// --- State Machine ---
enum class NodeState {
    CONNECTING_WIFI,
    CONNECTING_MQTT,
    RUNNING,
    SENSOR_ERROR
};

// --- Global Objects ---
DHT          dht(PIN_DHT, DHT_TYPE);
WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

NodeState     state        = NodeState::CONNECTING_WIFI;
unsigned long lastAction   = 0;
unsigned long lastDhtRead  = 0;
int           sensorErrors = 0;

// --- Prototypes ---
void handleConnectingWiFi();
void handleConnectingMQTT();
void handleRunning();
void handleSensorError();
void transitionTo(NodeState next, const char* reason);
int  readLightPercentage();
void publishData(float t, float h, int l);

void setup() {
    Serial.begin(115200);
    dht.begin();
    analogSetAttenuation(ADC_11db);
    mqttClient.setServer(MQTT_BROKER_IP, MQTT_BROKER_PORT);

    Serial.println("[INIT] Climate_Light_Node starting");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
}

void loop() {
    mqttClient.loop();

    switch (state) {
        case NodeState::CONNECTING_WIFI: handleConnectingWiFi(); break;
        case NodeState::CONNECTING_MQTT: handleConnectingMQTT(); break;
        case NodeState::RUNNING:         handleRunning();        break;
        case NodeState::SENSOR_ERROR:    handleSensorError();    break;
    }
}

void handleConnectingWiFi() {
    if (millis() - lastAction < WIFI_RETRY_INTERVAL) return;
    lastAction = millis();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WIFI] Connected — IP: %s\n", WiFi.localIP().toString().c_str());
        transitionTo(NodeState::CONNECTING_MQTT, "WiFi up");
        return;
    }

    Serial.print(".");
}

void handleConnectingMQTT() {
    if (WiFi.status() != WL_CONNECTED) {
        transitionTo(NodeState::CONNECTING_WIFI, "WiFi lost during MQTT connect");
        return;
    }

    if (millis() - lastAction < MQTT_RETRY_INTERVAL) return;
    lastAction = millis();

    if (mqttClient.connect(MQTT_CLIENT_ID)) {
        Serial.println("[MQTT] Connected to broker");
        transitionTo(NodeState::RUNNING, "MQTT up");
        return;
    }

    Serial.printf("[MQTT] Failed (state=%d), retrying...\n", mqttClient.state());
}

void handleRunning() {
    if (WiFi.status() != WL_CONNECTED) {
        transitionTo(NodeState::CONNECTING_WIFI, "WiFi lost");
        return;
    }

    if (!mqttClient.connected()) {
        transitionTo(NodeState::CONNECTING_MQTT, "MQTT disconnected");
        return;
    }

    if (millis() - lastDhtRead < DHT_INTERVAL) return;
    lastDhtRead = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (isnan(h) || isnan(t)) {
        sensorErrors++;
        transitionTo(NodeState::SENSOR_ERROR, "DHT11 read failed");
        return;
    }

    sensorErrors = 0;
    publishData(t, h, readLightPercentage());
}

void handleSensorError() {
    if (millis() - lastDhtRead < DHT_INTERVAL) return;
    lastDhtRead = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();

    if (!isnan(h) && !isnan(t)) {
        sensorErrors = 0;
        publishData(t, h, readLightPercentage());
        transitionTo(NodeState::RUNNING, "DHT11 recovered");
        return;
    }

    sensorErrors++;
    Serial.printf("[SENSOR] DHT11 error #%d\n", sensorErrors);

    if (sensorErrors >= SENSOR_ERROR_MAX) {
        Serial.println("[SENSOR] Max errors reached — check wiring");
    }
}

void transitionTo(NodeState next, const char* reason) {
    const char* names[] = { "CONNECTING_WIFI", "CONNECTING_MQTT", "RUNNING", "SENSOR_ERROR" };
    Serial.printf("[STATE] %s -> %s (%s)\n", names[(int)state], names[(int)next], reason);
    state      = next;
    lastAction = millis();
}

int readLightPercentage() {
    int raw = analogRead(PIN_LDR);
    return constrain(map(raw, LDR_FLOOR, LDR_CEIL, 0, 100), 0, 100);
}

void publishData(float t, float h, int l) {
    JsonDocument doc;
    doc["temperature"] = t;
    doc["humidity"]    = (int)h;
    doc["light_level"] = l;
    doc["noise_level"] = 0;

    char payload[128];
    serializeJson(doc, payload);
    mqttClient.publish(MQTT_TOPIC, payload);

    Serial.printf("[PUB] %s\n", payload);
}
