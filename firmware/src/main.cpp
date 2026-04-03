#include <Arduino.h>
#include <DHT.h>
#include <ArduinoJson.h>

// --- Hardware Configuration ---
#define PIN_LDR 2 
#define PIN_DHT 5
#define DHT_TYPE DHT11

// --- Calibration & Timing ---
const int LDR_FLOOR      = 15;   
const int LDR_CEIL       = 1500; 
const int DHT_TICK_MS    = 2500; // Minimum stable interval for DHT11
const int SERIAL_TICK_MS = 2500; // Unified JSON broadcast interval

// --- Global Objects & State ---
DHT dht(PIN_DHT, DHT_TYPE);
unsigned long lastDhtRead = 0;
float currentTemp = 0;
float currentHum  = 0;

// --- Prototypes ---
int readLightPercentage();
void broadcastData(float t, float h, int l);

void setup() {
    Serial.begin(115200);
    dht.begin();
    analogSetAttenuation(ADC_11db);
    Serial.println("{\"status\": \"Climate_Light_Node_Ready\"}");
}

void loop() {
    // How: Non-blocking task management
    // Why: We need to respect the DHT11's slow sampling rate (2.5s)
    if (millis() - lastDhtRead >= DHT_TICK_MS) {
        float h = dht.readHumidity();
        float t = dht.readTemperature();
        int light = readLightPercentage();

        // Error Handling: Digital sensors can fail; analog sensors (LDR) just drift
        if (isnan(h) || isnan(t)) {
            Serial.println("{\"error\": \"DHT_Sensor_Communication_Failed\"}");
        } else {
            currentTemp = t;
            currentHum = h;
            broadcastData(currentTemp, currentHum, light);
        }

        lastDhtRead = millis();
    }
}

/**
 * @brief Reads the LDR and maps it to a percentage.
 */
int readLightPercentage() {
    int raw = analogRead(PIN_LDR);
    int percentage = map(raw, LDR_FLOOR, LDR_CEIL, 0, 100);
    return constrain(percentage, 0, 100);
}

/**
 * @brief Sends a unified JSON object to the Go Backend.
 */
void broadcastData(float t, float h, int l) {
    JsonDocument doc;
    doc["sensor"] = "bedroom_node";
    doc["temp"]   = t;
    doc["hum"]    = h;
    doc["light"]  = l;

    serializeJson(doc, Serial);
    Serial.println(); 
}