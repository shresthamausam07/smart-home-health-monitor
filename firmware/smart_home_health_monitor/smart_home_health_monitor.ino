//  ============================================================
//  Smart Home Health Monitor
//  XIAO ESP32-C6 Firmware
//
//  Sensors:
//    - AHT10      → Temperature & Humidity  (I2C, 0x38)
//    - LCD1602    → Display                  (I2C, 0x27)
//    - MH-Z19C    → CO2 (NDIR)              (UART, Serial1, D6/D7)
//    - MS1100     → VOC                     (Analog, D0/A0)
//    - DC01       → PM2.5                   (UART, Serial2, D8/D9)
//
//  Output:
//    - LCD display (rotating 3-screen data view)
//    - LED on D3 (smart plug stand-in) — ON when thresholds exceeded
//    - MQTT publish (sensor data + purifier command)
//    - Firebase Firestore REST API (60s interval)
//
//  Pin Map (XIAO ESP32-C6):
//    D4 (GPIO6)  = SDA
//    D5 (GPIO7)  = SCL
//    D6 (GPIO21) = CO2 TX → MH-Z19C RX
//    D7 (GPIO20) = CO2 RX ← MH-Z19C TX
//    D8 (GPIO17) = PM25 TX → DC01 RX
//    D9 (GPIO18) = PM25 RX ← DC01 TX
//    D0 (GPIO2)  = VOC analog input
//    D3 (GPIO5)  = Alert LED
// ============================================================

#include "config.h"
#include <Adafruit_AHTX0.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <MHZ19.h>
#include <PubSubClient.h>
#include <time.h>
#include <WiFi.h>
#include <Wire.h>

// ---- Pin Definitions ----
// Using Arduino board macros (D4, D5, etc.) instead of raw GPIO numbers
// so the XIAO ESP32-C6 board definition handles the correct mapping
#define CO2_TX_PIN D6    // → MH-Z19C RX
#define CO2_RX_PIN D7    // ← MH-Z19C TX
#define PM25_TX_PIN D8   // → DC01 RX
#define PM25_RX_PIN D9   // ← DC01 TX
#define VOC_PIN A0       // MS1100 analog
#define ALERT_LED_PIN D3  // LED indicator
// LED is wired active-high (GPIO → resistor → LED anode → cathode → GND).
// HIGH = on, LOW = off.
#define LED_ON  HIGH
#define LED_OFF LOW

// ---- Sensor Objects ----
Adafruit_AHTX0 aht;
LiquidCrystal_I2C lcd(0x27, 16, 2);
MHZ19 mhz19;
HardwareSerial co2Serial(1);  // UART1 for MH-Z19C
HardwareSerial pm25Serial(2); // UART2 for DC01

// ---- Network Objects ----
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ---- Sensor Data ----
float temperature = 0.0;
float humidity = 0.0;
int co2 = 0;
int voc = 0;
float pm25 = 0.0;

// ---- Timing ----
unsigned long lastSensorRead = 0;
unsigned long lastFirebasePush = 0;
unsigned long lastLcdRotate = 0;
int lcdScreen = 0;

// ---- State ----
bool purifierOn = false;
bool timeSynced = false;

// ============================================================
//  TIME HELPERS
// ============================================================
unsigned long long getEpochMs() {
  time_t now = time(nullptr);
  if (now < 1700000000) { // ~2023-11-14
    return 0;
  }
  return (unsigned long long)now * 1000ULL;
}

void syncClockIfNeeded() {
  if (timeSynced || WiFi.status() != WL_CONNECTED) {
    return;
  }

  configTime(0, 0, "pool.ntp.org", "time.nist.gov", "time.google.com");
  Serial.print("[TIME] Syncing NTP");
  for (int i = 0; i < 20; i++) {
    if (getEpochMs() > 0) {
      timeSynced = true;
      Serial.println(" [OK]");
      Serial.printf("[TIME] Epoch ms ready: %llu\n", getEpochMs());
      return;
    }
    Serial.print(".");
    delay(250);
  }
  Serial.println(" [WARN] NTP sync timeout; will retry later");
}

// ============================================================
//  SETUP
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n== Smart Home Health Monitor ==");

  // LED pin
  pinMode(ALERT_LED_PIN, OUTPUT);
  digitalWrite(ALERT_LED_PIN, LED_OFF);

  // I2C — use D4 (SDA) and D5 (SCL) board macros
  // The XIAO ESP32-C6 board definition maps these to the correct GPIO pins
  Wire.begin(D4, D5);

  // LCD
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Air Quality");
  lcd.setCursor(0, 1);
  lcd.print("Monitor v1.0");
  delay(2000);
  lcd.clear();

  // AHT10
  if (!aht.begin()) {
    Serial.println("[ERROR] AHT10 not found — check wiring!");
    lcd.print("AHT10 ERROR");
  } else {
    Serial.println("[OK] AHT10 initialized");
  }

  // MH-Z19C CO2 sensor (UART1)
  co2Serial.begin(9600, SERIAL_8N1, CO2_RX_PIN, CO2_TX_PIN);
  mhz19.begin(co2Serial);
  mhz19.autoCalibration(true); // ABC enabled
  Serial.println("[OK] MH-Z19C initialized");

  // DC01 PM2.5 sensor (UART2)
  pm25Serial.begin(9600, SERIAL_8N1, PM25_RX_PIN, PM25_TX_PIN);
  Serial.println("[OK] DC01 PM2.5 serial started");

  // WiFi
  connectWifi();
  syncClockIfNeeded();

  // MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  Serial.println("[READY] All systems initialized");
  Serial.println("Waiting 30s for CO2 sensor warm-up...");
  lcd.setCursor(0, 0);
  lcd.print("Warming up...");
  lcd.setCursor(0, 1);
  lcd.print("30s CO2 warmup");
  delay(30000);
  lcd.clear();
}

// ============================================================
//  LOOP
// ============================================================
void loop() {
  unsigned long now = millis();

  // Reconnect WiFi if dropped
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    syncClockIfNeeded();
  }

  // Reconnect MQTT if dropped
  if (!mqttClient.connected()) {
    connectMqtt();
  }
  mqttClient.loop();

  // Read all sensors on interval
  if (now - lastSensorRead >= SENSOR_READ_INTERVAL) {
    lastSensorRead = now;
    readAllSensors();
    checkThresholds();
    publishMqtt();
  }

  // Rotate LCD display
  if (now - lastLcdRotate >= LCD_ROTATE_INTERVAL) {
    lastLcdRotate = now;
    updateLcd();
  }

  // Push to Firebase on interval
  if (now - lastFirebasePush >= FIREBASE_PUSH_INTERVAL) {
    lastFirebasePush = now;
    pushToFirebase();
  }
}

// ============================================================
//  READ ALL SENSORS
// ============================================================
void readAllSensors() {
  // --- AHT10: Temperature & Humidity ---
  sensors_event_t humEvent, tempEvent;
  aht.getEvent(&humEvent, &tempEvent);
  temperature = tempEvent.temperature;
  humidity = humEvent.relative_humidity;

  // --- MH-Z19C: CO2 ---
  co2 = mhz19.getCO2();
  if (co2 < 0)
    co2 = 0; // sensor returns -1 on error

  // --- MS1100: VOC (analog) ---
  int rawVoc = analogRead(VOC_PIN);
  // Apply simple moving average (5 samples)
  static int vocBuffer[5] = {0};
  static int vocIdx = 0;
  vocBuffer[vocIdx] = rawVoc;
  vocIdx = (vocIdx + 1) % 5;
  int vocSum = 0;
  for (int i = 0; i < 5; i++)
    vocSum += vocBuffer[i];
  voc = vocSum / 5;

  // --- DC01: PM2.5 ---
  pm25 = readDC01();

  Serial.printf("[SENSORS] Temp: %.1f°C | Hum: %.1f%% | CO2: %d ppm | VOC: %d "
                "| PM2.5: %.1f µg/m³\n",
                temperature, humidity, co2, voc, pm25);
}

// ============================================================
//  DC01 PM2.5 PARSER — Winsen DC01 (ZH1.5mm 4P)
//  Pin 1=GND, Pin 2=VCC(5V), Pin 3=RXD, Pin 4=TXD
//  Request:  FF 01 86 00 00 00 00 00 79
//  Response: FF 86 [PM_H] [PM_L] xx xx xx xx [CS]
// ============================================================
float readDC01() {
  // First: listen passively for 1 second to catch any auto-output
  unsigned long listenStart = millis();
  while (millis() - listenStart < 1000) {
    if (pm25Serial.available() > 0) {
      Serial.print("[DC01 PASSIVE] Bytes received: ");
      while (pm25Serial.available()) {
        Serial.printf("%02X ", pm25Serial.read());
      }
      Serial.println();
      break;
    }
    delay(10);
  }

  // Then try active query
  while (pm25Serial.available())
    pm25Serial.read(); // Flush

  uint8_t cmd[] = {0xFF, 0x01, 0x86, 0x00, 0x00, 0x00, 0x00, 0x00, 0x79};
  pm25Serial.write(cmd, sizeof(cmd));

  unsigned long t = millis();
  while (pm25Serial.available() < 9 && millis() - t < 500)
    delay(10);

  if (pm25Serial.available() >= 9) {
    uint8_t buf[9];
    pm25Serial.readBytes(buf, 9);
    Serial.printf("[DC01 RAW] %02X %02X %02X %02X %02X %02X %02X %02X %02X\n",
                  buf[0], buf[1], buf[2], buf[3], buf[4], buf[5], buf[6],
                  buf[7], buf[8]);

    // Validate header
    if (buf[0] != 0xFF || buf[1] != 0x86) {
      Serial.println("[WARN] DC01 bad header — discarding frame");
      return pm25;
    }

    // Validate Winsen checksum: CS = (~sum(buf[1..7]) + 1) & 0xFF
    uint8_t sum = 0;
    for (int i = 1; i <= 7; i++) sum += buf[i];
    uint8_t expectedCs = (~sum + 1) & 0xFF;
    if (buf[8] != expectedCs) {
      Serial.printf("[WARN] DC01 checksum mismatch (got 0x%02X, expected 0x%02X) — discarding frame\n",
                    buf[8], expectedCs);
      return pm25;
    }

    int raw = (buf[2] << 8) | buf[3];

    // Sanity bounds: DC01 range is 0–1000 µg/m³ per datasheet
    if (raw < 0 || raw > 1000) {
      Serial.printf("[WARN] DC01 value %d out of range — discarding\n", raw);
      return pm25;
    }

    return (float)raw;
  }

  Serial.println("[WARN] DC01 no valid response — returning last value");
  return pm25;
}

// ============================================================
//  THRESHOLD CHECK & LED CONTROL
// ============================================================
void checkThresholds() {
  bool co2Trigger  = co2  >= CO2_THRESHOLD;
  bool pm25Trigger = pm25 >= PM25_THRESHOLD;
  bool vocTrigger  = voc  >= VOC_THRESHOLD;
  bool shouldActivate = co2Trigger || pm25Trigger || vocTrigger;

  Serial.printf("[THRESHOLD] CO2=%d(%s) PM2.5=%.1f(%s) VOC=%d(%s) → %s\n",
    co2,  co2Trigger  ? "TRIGGER" : "ok",
    pm25, pm25Trigger ? "TRIGGER" : "ok",
    voc,  vocTrigger  ? "TRIGGER" : "ok",
    shouldActivate    ? "ACTIVATE" : "deactivate");

  if (shouldActivate && !purifierOn) {
    purifierOn = true;
    digitalWrite(ALERT_LED_PIN, LED_ON);
    Serial.println(
        "[ACTION] Threshold exceeded — LED ON (purifier would activate)");
  } else if (!shouldActivate && purifierOn) {
    purifierOn = false;
    digitalWrite(ALERT_LED_PIN, LED_OFF);
    Serial.println(
        "[ACTION] Air quality OK — LED OFF (purifier would deactivate)");
  }
}

// ============================================================
//  LCD DISPLAY (3 rotating screens)
// ============================================================
void updateLcd() {
  lcd.clear();
  switch (lcdScreen) {
  case 0:
    // Screen 1: Temperature & Humidity
    lcd.setCursor(0, 0);
    lcd.print("Temp: ");
    lcd.print(temperature, 1);
    lcd.print(" C");
    lcd.setCursor(0, 1);
    lcd.print("Hum:  ");
    lcd.print(humidity, 1);
    lcd.print(" %");
    break;

  case 1:
    // Screen 2: CO2 & VOC
    lcd.setCursor(0, 0);
    lcd.print("CO2:  ");
    lcd.print(co2);
    lcd.print(" ppm");
    lcd.setCursor(0, 1);
    lcd.print("VOC:  ");
    lcd.print(voc);
    break;

  case 2:
    // Screen 3: PM2.5 & Status
    lcd.setCursor(0, 0);
    lcd.print("PM2.5:");
    lcd.print(pm25, 1);
    lcd.print(" ug");
    lcd.setCursor(0, 1);
    lcd.print(purifierOn ? "PURIFIER: ON  " : "Air: OK       ");
    break;
  }

  lcdScreen = (lcdScreen + 1) % 3;
}

// ============================================================
//  MQTT PUBLISH
// ============================================================
void publishMqtt() {
  if (!mqttClient.connected())
    return;

  // Publish sensor data as JSON
  char payload[200];
  snprintf(payload, sizeof(payload),
           "{\"temp\":%.1f,\"humidity\":%.1f,\"co2\":%d,\"voc\":%d,\"pm25\":%."
           "1f,\"purifier\":%s}",
           temperature, humidity, co2, voc, pm25,
           purifierOn ? "true" : "false");

  mqttClient.publish("air-quality/sensors", payload);

  // Publish purifier command (for Tasmota smart plug or LED demo)
  mqttClient.publish(MQTT_TOPIC_PURIFIER, purifierOn ? "ON" : "OFF");

  Serial.printf("[MQTT] Published: %s\n", payload);
}

// ============================================================
//  FIREBASE PUSH (REST API)
// ============================================================
void pushToFirebase() {
  if (WiFi.status() != WL_CONNECTED)
    return;

  HTTPClient http;

  // Build URL: RTDB REST endpoint
  String url = "https://";
  url += FIREBASE_HOST;
  url += "/sensor_readings.json?auth=";
  url += FIREBASE_AUTH;

  // Build JSON payload
  StaticJsonDocument<320> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["co2"] = co2;
  doc["voc"] = voc;
  doc["pm25"] = pm25;
  doc["purifier"] = purifierOn;
  doc["device_uptime_ms"] = millis();

  // Prefer explicit epoch timestamp when NTP is available.
  unsigned long long epochMs = getEpochMs();
  if (epochMs > 0) {
    doc["timestamp"] = epochMs;
    doc["timestamp_source"] = "ntp_epoch_ms";
  } else {
    JsonObject tsObj = doc.createNestedObject("timestamp");
    tsObj[".sv"] = "timestamp";
    doc["timestamp_source"] = "firebase_server_value";
  }

  String jsonBody;
  serializeJson(doc, jsonBody);

  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  int httpCode = http.POST(jsonBody);

  if (httpCode == 200 || httpCode == 204) {
    Serial.println("[FIREBASE] Data pushed successfully");
    Serial.printf("[FIREBASE] Timestamp source: %s | uptime_ms=%lu\n",
                  (const char *)doc["timestamp_source"], millis());
  } else {
    Serial.printf("[FIREBASE] Error: HTTP %d\n", httpCode);
  }

  http.end();
}

// ============================================================
//  WIFI CONNECTION
// ============================================================
void connectWifi() {
  Serial.printf("[WiFi] Connecting to %s ", WIFI_SSID);
  lcd.setCursor(0, 0);
  lcd.print("Connecting WiFi");

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("\n[WiFi] Connected! IP: %s\n",
                  WiFi.localIP().toString().c_str());
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi Connected!");
    lcd.setCursor(0, 1);
    lcd.print(WiFi.localIP().toString());
    delay(2000);
    lcd.clear();
  } else {
    Serial.println("\n[WiFi] Failed — running offline");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi FAILED");
    lcd.setCursor(0, 1);
    lcd.print("Offline mode");
    delay(2000);
    lcd.clear();
  }
}

// ============================================================
//  MQTT CONNECTION
// ============================================================
void connectMqtt() {
  Serial.print("[MQTT] Connecting...");
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    if (mqttClient.connect(MQTT_CLIENT)) {
      Serial.println(" connected!");
    } else {
      Serial.printf(" failed (rc=%d), retrying...\n", mqttClient.state());
      delay(2000);
      attempts++;
    }
  }
}
