#include <Arduino.h>
#include <ArduinoJson.h>

// --- Configuration ---
#define PIN_LDR 1 
const int LDR_FLOOR = 15;   
const int LDR_CEIL  = 1500; 
const int TICK_RATE = 2000; 

unsigned long lastTick = 0;

int readLightPercentage();
void sendJson(int lightLevel);

void setup() {
    Serial.begin(115200);
    analogSetAttenuation(ADC_11db); // Standard 0-3.1V range
    Serial.println("{\"status\": \"LDR_Module_Ready\"}");
}

void loop() {
    if (millis() - lastTick >= TICK_RATE) {
        sendJson(readLightPercentage());
        lastTick = millis();
    }
}

int readLightPercentage() {
    int raw = analogRead(PIN_LDR);
    // Linear mapping from raw ADC to percentage
    int percentage = map(raw, LDR_FLOOR, LDR_CEIL, 0, 100);
    return constrain(percentage, 0, 100);
}

void sendJson(int lightLevel) {
    JsonDocument doc;
    doc["sensor"] = "light_ldr";
    doc["value"] = lightLevel;
    doc["unit"] = "%";

    serializeJson(doc, Serial);
    Serial.println(); 
}