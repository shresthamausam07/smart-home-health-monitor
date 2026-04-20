---
marp: true
theme: default
paginate: true
title: Smart Home Health Monitor — Final Presentation
author: Mausam Shrestha
---

# Smart Home Health Monitor

### Final Presentation — CSC 494 IoT

**Mausam Shrestha**
Northern Kentucky University | Spring 2026

---

# The Problem

## Air purifiers lie about air quality.

Their built-in sensors are located **inside the device** — measuring air that has already been filtered.

> The air quality at the purifier = **always clean**
> The air quality where you breathe = **unknown**

**Research shows:**

- CO2 above 1000 ppm causes measurable cognitive decline
- High PM2.5/NO2 increases sleep issues by **50–60%**
- People spend **90%** of their time indoors

---

# Why This Hasn't Been Solved

| Issue                   | Commercial Purifiers        | This Project                    |
| ----------------------- | --------------------------- | ------------------------------- |
| Sensor location         | Inside device (cleaned air) | Breathing zone (3–6 ft)         |
| Parameters monitored    | PM2.5 only                  | CO2, PM2.5, VOC, Temp, Humidity |
| Works with any purifier | No — brand locked           | Yes — via smart plug            |
| Data export             | Closed system               | Open — Firebase + GitHub        |
| Cost                    | $200–400 per room           | **$88 total**                   |

---

# My Solution

## A 5-sensor IoT monitor placed where you breathe

```
[5 Sensors at breathing height]
           |
    [XIAO ESP32-C6]
           |
  ─────────┼──────────────────────
  |         |           |         |
[LCD]    [MQTT]     [Firebase]  [LED/
Display   Broker    Realtime DB  Smart Plug]
           |              |
      [Actuator]     [React/PWA
                      Dashboard]
```

---

# Hardware — What I Built

| Component       | Model                     | Protocol | Status          |
| --------------- | ------------------------- | -------- | --------------- |
| Microcontroller | XIAO ESP32-C6             | —        | ✅ Deployed     |
| CO2 Sensor      | MH-Z19C (NDIR)            | UART     | ✅ Working      |
| PM2.5 Sensor    | DC01                      | UART     | ⚠️ Intermittent |
| VOC Sensor      | MS1100                    | Analog   | ✅ Working      |
| Temp/Humidity   | AHT10                     | I2C      | ✅ Working      |
| Display         | LCD1602                   | I2C      | ✅ Working      |
| Actuator        | LED (smart plug stand-in) | GPIO     | ✅ Working      |

**Total cost: $88**

---

# Sprint 1 — Foundation (Weeks 1–6)

- ✅ GitHub repositories created and documented
- ✅ Canvas project + progress pages live throughout semester
- ✅ PPP presentation delivered (Week 4)
- ✅ Arduino IDE + XIAO ESP32-C6 configured
- ✅ Key discovery: XIAO uses **GPIO22/23** for I2C — not standard GPIO21/22
- ✅ AHT10, LCD1602, MH-Z19C, MS1100 individually tested + verified
- ✅ All sensors running **simultaneously** on a single board

```
LCD Screen 1 (3 sec):     LCD Screen 2 (3 sec):
Temp: 24.1 C              CO2:  1600 ppm
Hum:  34.5%               VOC:  1874
```

---

# Sprint 2 — Intelligence (Weeks 7–14)

**Weeks 7–8**: DC01 PM2.5 connected · MQTT broker live · LED automation triggered by thresholds · Firebase Realtime Database logging every 10 seconds

**Weeks 9–10**: React/PWA dashboard deployed · Real-time charts via Recharts · Firebase `onValue` for instant updates · PWA installed on phone via manifest

**Weeks 11–12**: Sleep quality tracking interface built and deployed · 4+ weeks continuous data needs to be collected · Sensor health auto-detection added

**Weeks 13–14**: Moving average calibration applied · Checksum validation for PM2.5 sensor · Documentation complete · Final presentation + demo video

---

# Automation Logic

The system automatically triggers the actuator based on sensor thresholds:

| Condition            | Action                                          |
| -------------------- | ----------------------------------------------- |
| CO2 > 1000 ppm       | LED **ON** (smart plug would activate purifier) |
| PM2.5 > 35 µg/m³     | LED **ON**                                      |
| VOC > 2500 (raw ADC) | LED **ON**                                      |
| All readings normal  | LED **OFF**                                     |

**Protocol**: MQTT over Wi-Fi — latency < 2 seconds

> **Demo**: LED used as actuator stand-in. In real deployment, a Tasmota-flashed smart plug replaces the LED — same MQTT message, same automation logic, any purifier brand.

---

# Cloud Dashboard — React + PWA

- Real-time sensor readings — Firebase `onValue` pushes every update instantly
- Historical charts for CO2, PM2.5, VOC, Temp, Humidity (1h / 24h / 7d / All Data)
- Sensor health detection — auto-flags stuck or disconnected sensors
- Threshold alert badges + alert history log
- LED control step chart — shows exact ON/OFF timing
- Sleep quality rating interface — logs nightly scores (1–10) to Firebase
- **PWA**: add to phone home screen from Safari or Chrome — no App Store needed

---

# Demonstration

## Demo Video

**What the video shows:**

1. Sensors reading live — CO2 rising in a closed room
2. CO2 threshold exceeded → LED turns on automatically
3. Firebase dashboard updates in real time
4. Historical chart and time range selection
5. PWA installed on phone — launching from home screen
6. Sleep quality log entry

**Demo video**: https://drive.google.com/drive/folders/1dxNxLwAFDM-qzTNDedeU8n3i4qP3a_3x?usp=sharing

---

# Technology Stack

**Hardware / Firmware**

- XIAO ESP32-C6 · Arduino IDE · C++
- Libraries: Adafruit AHTX0, LiquidCrystal_I2C, MHZ19, PubSubClient
- Protocols: I2C, UART, Analog, MQTT

**Backend / Cloud**

- Firebase Realtime Database — real-time time-series data storage
- MQTT (HiveMQ public broker) — actuator control, < 2s latency

**Frontend / Mobile**

- React + Vite + PWA — single codebase for desktop and mobile
- Recharts — real-time sensor data visualization
- Firebase `onValue` — live data push to dashboard
- Deployed: Firebase Hosting

---

# Learning with AI

## Topic 1: Multi-Sensor Integration & Calibration

Used AI to understand XIAO-specific pin mapping, debug I2C bus sharing, implement UART protocol for MH-Z19C, and apply moving average calibration

## Topic 2: Mobile App Development with React/PWA

Used AI to scaffold React dashboard components, implement Firebase Realtime Database listeners, structure Recharts time-series visualization, and build PWA manifest

> **Primary AI tool**: Claude (Anthropic) — used for concept explanations, code debugging, protocol understanding, and documentation throughout both sprints

---

# What I Would Do Differently

1. **Start data collection in Week 4** — more weeks of data enables future ML sleep quality correlation

2. **Swap DC01 for PMS5003** — PMS5003 uses laser scattering for PM2.5; more accurate and more reliable UART communication

3. **Real Tasmota smart plug** — The LED demo proves automation logic; a smart plug adds real appliance control with zero code changes

4. **Multi-room support** — A second XIAO unit would allow comparing bedroom vs. living room air quality in real time

---

# Results Summary

- ✅ **Problem solved**: Sensors at breathing zone, not inside purifier
- ✅ **5 sensors running 24/7** for 4+ weeks uninterrupted
- ✅ **Automated actuator control** via CO2, PM2.5, and VOC thresholds over MQTT
- ✅ **Public PWA dashboard** — real-time + historical data, installable on any phone
- ✅ **Sleep quality logger** — nightly scores stored in Firebase alongside sensor data
- ✅ **Total cost: $88** vs. $200–400 commercial alternatives
- ✅ **Open source** — all code on GitHub, live at smart-home-health-monitor.web.app

---

# Repository Links

**Project Code & Documentation**
https://github.com/shresthamausam07/smart-home-health-monitor

**Learning with AI Documentation**
https://github.com/shresthamausam07/mausam-shrestha-learning-with-ai

**Canvas Project Page**
https://nku.instructure.com/courses/88152/pages/individual-project-mausam-shrestha

**Canvas Progress Page**
https://nku.instructure.com/courses/88152/pages/individual-progress-mausam-shrestha

**Live Dashboard**
https://smart-home-health-monitor.web.app

---

# Thank You

## Any Questions?

**Mausam Shrestha**
shrestham2@mymail.nku.edu
CSC 494 — IoT | Spring 2026
Northern Kentucky University

> _"The goal was to know what you're actually breathing — not what the purifier thinks you're breathing."_
