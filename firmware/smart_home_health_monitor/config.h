// ============================================================
//  Smart Home Health Monitor — config.h
//  XIAO ESP32-C6
//  Fill in your WiFi, MQTT, and Firebase credentials here.
// ============================================================

#ifndef CONFIG_H
#define CONFIG_H

// ----- WiFi -----
#define WIFI_SSID "SpectrumSetup-6F"
#define WIFI_PASSWORD "leaderstable397"

// ----- MQTT Broker (Tasmota smart plug / LED control) -----
#define MQTT_BROKER "broker.hivemq.com"  // Free public MQTT broker — no setup needed
#define MQTT_PORT 1883
#define MQTT_CLIENT "air-quality-mausam-shrestha"  // Must be unique on public broker
#define MQTT_TOPIC_PURIFIER "mausam/airmonitor/purifier"

// ----- Firebase -----
// Get these from Firebase Console → Project Settings → Service Accounts → REST
// API
#define FIREBASE_HOST "smart-home-health-monitor-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "7XC5KcoBzUpwtNKHKhSmx2IOgWMX01XsXytCkLli"

// ----- Sensor Thresholds -----
#define CO2_THRESHOLD 1000   // ppm
#define PM25_THRESHOLD 35    // µg/m³
#define VOC_THRESHOLD 2500   // MS1100 raw ADC — high VOC level

// ----- Timing -----
#define SENSOR_READ_INTERVAL 10000   // ms — read all sensors every 10 seconds
#define FIREBASE_PUSH_INTERVAL 10000 // ms — push to Firebase every 10 seconds
#define LCD_ROTATE_INTERVAL 3000     // ms — rotate LCD screen every 3 seconds

#endif
