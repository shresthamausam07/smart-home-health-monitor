# Smart Home Health Monitor

An intelligent IoT air quality monitoring system that addresses the critical limitations of commercial air purifiers by providing accurate, multi-parameter environmental monitoring and smart automation.

## Project Overview

### Problem Statement

Current air purifier sensors have three major flaws:
1. **Location Bias**: Built-in sensors measure air inside the purifier (already cleaned), not where you breathe
2. **Limited Parameters**: Most only measure PM2.5, missing CO2 and VOCs
3. **Inferior Technology**: Cheap infrared sensors with poor accuracy

Research shows that indoor air quality directly impacts health:
- High PM2.5/NO2 increases sleep issues by 50-60%
- CO2 levels above 1000 ppm reduce cognitive function significantly
- 73 million baby boomers need better home air quality solutions

### Solution

A separate air quality monitor that:
- Places sensors at **breathing zone height** (3-6 ft), not at the purifier
- Measures **multiple parameters**: CO2, PM2.5, VOC, temperature, humidity
- Controls **any purifier** via smart plug based on accurate readings
- Provides **health insights** through sleep quality correlation
- Uses **machine learning** for predictive automation

## Key Features

### Phase 1: MVP (Weeks 1-6)
- Multi-parameter air quality sensing (CO2, PM2.5, VOC, temp, humidity)
- Real-time OLED display
- Web dashboard with live readings
- Smart plug integration for purifier control
- Basic automation (turn on when PM2.5 > 35 µg/m³)
- Local data logging

### Phase 2: Intelligence (Weeks 7-10)
- Mobile progressive web app (PWA)
- Historical data visualization with charts
- Sleep quality tracking and correlation
- Multi-room monitoring support
- Cloud sync (Firebase/MQTT)
- Alert system (push notifications)

### Phase 3: AI/ML (Weeks 11-12)
- Machine learning model for sleep quality prediction
- Predictive automation (anticipate air quality drops)
- Weekly health reports and insights
- Personalized recommendations

## Technologies & Tools

### Hardware Components
| Component | Model | Cost | Purpose |
|-----------|-------|------|---------|
| Microcontroller | ESP32 DevKitC | $8 | WiFi-enabled brain |
| CO2 Sensor | MH-Z19B | $20 | NDIR CO2 measurement |
| PM2.5 Sensor | PMS5003 | $25 | Laser particulate detection |
| VOC Sensor | SGP40 | $10 | Volatile organic compounds |
| Temp/Humidity | AHT20 | $5 | Environmental compensation |
| Display | 0.96" OLED | $8 | Real-time feedback |
| Smart Plug | Tasmota Compatible | $12 | Purifier control |
| **Total** | | **~$88** | |

### Software Stack
- **Firmware**: Arduino/PlatformIO (C++)
- **Protocols**: MQTT, I2C, UART
- **Backend**: Node.js + Express or Firebase
- **Frontend**: React or Vue.js
- **Mobile**: React Native (PWA initially)
- **Database**: InfluxDB (time-series) or Firebase Firestore
- **ML**: Python + scikit-learn or TensorFlow Lite
- **Visualization**: Chart.js or Recharts

### Development Tools
- VS Code with PlatformIO
- Git/GitHub for version control
- Postman for API testing
- Firebase Console
- Claude/AI for learning assistance

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ESP32 Monitor                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ MH-Z19B  │  │ PMS5003  │  │  SGP40   │          │
│  │   CO2    │  │  PM2.5   │  │   VOC    │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       │             │              │                 │
│       └─────────────┴──────────────┘                │
│                     │                                │
│              ┌──────┴──────┐                        │
│              │   ESP32     │                        │
│              │  Firmware   │                        │
│              └──────┬──────┘                        │
│                     │                                │
│         ┌───────────┼───────────┐                   │
│         │           │           │                   │
│    ┌────▼────┐ ┌───▼────┐ ┌───▼────┐              │
│    │  OLED   │ │ WiFi   │ │ Local  │              │
│    │ Display │ │  MQTT  │ │Storage │              │
│    └─────────┘ └───┬────┘ └────────┘              │
└────────────────────┼──────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
    ┌────▼─────┐         ┌──────▼──────┐
    │  Cloud   │         │  Smart Plug │
    │ Backend  │         │  (Purifier) │
    │(Firebase)│         └─────────────┘
    └────┬─────┘
         │
    ┌────▼─────────┐
    │  Web/Mobile  │
    │  Dashboard   │
    └──────────────┘
```

## Success Metrics

### Technical Metrics
- Sensor accuracy within ±20% of EPA reference monitors
- 99% uptime over 4+ weeks continuous operation
- <500ms response time for web dashboard
- <2 second latency for purifier control

### Health Outcome Metrics
- Collect 4+ weeks of continuous air quality data
- Identify statistically significant sleep quality correlations
- Achieve 85%+ accuracy in ML sleep quality predictions
- Demonstrate measurable improvement in air quality metrics

### Project Completion Metrics
- Functional mobile app with historical data
- Automated purifier control working reliably
- Data visualization with trends and insights
- Successful PPP presentation with live demo

## Getting Started

### Prerequisites
```bash
# Install PlatformIO
pip install platformio

# Install Node.js (for backend)
brew install node  # macOS
# or download from nodejs.org

# Install Firebase CLI
npm install -g firebase-tools
```

### Hardware Setup
1. Connect sensors to ESP32:
   - MH-Z19B: TX→RX2, RX→TX2, 5V, GND
   - PMS5003: TX→RX1, RX→TX1, 5V, GND
   - SGP40: SDA→GPIO21, SCL→GPIO22, 3.3V, GND
   - AHT20: SDA→GPIO21, SCL→GPIO22, 3.3V, GND
   - OLED: SDA→GPIO21, SCL→GPIO22, 3.3V, GND

2. Mount monitor at breathing zone height (3-6 ft)
3. Avoid placement near: windows, HVAC vents, heat sources

### Software Setup
```bash
# Clone repository
git clone https://github.com/shresthamausam07/smart-home-health-monitor.git
cd smart-home-health-monitor

# Install dependencies
cd firmware
platformio lib install

# Configure WiFi credentials
cp src/config.example.h src/config.h
# Edit config.h with your WiFi SSID/password

# Build and upload
platformio run --target upload

# Start web dashboard
cd ../web-dashboard
npm install
npm start
```

## Project Structure

```
smart-home-health-monitor/
├── firmware/                 # ESP32 firmware
│   ├── src/
│   │   ├── main.cpp         # Main application
│   │   ├── sensors/         # Sensor drivers
│   │   ├── display/         # OLED display
│   │   ├── mqtt/            # MQTT client
│   │   └── config.h         # Configuration
│   └── platformio.ini       # PlatformIO config
├── web-dashboard/           # Web interface
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # Backend API
│   │   └── utils/           # Utilities
│   └── package.json
├── mobile-app/              # Mobile PWA
│   └── (React Native or PWA)
├── ml-models/               # Machine learning
│   ├── data/                # Training data
│   ├── notebooks/           # Jupyter notebooks
│   └── models/              # Trained models
├── docs/                    # Documentation
│   ├── hardware-setup.md
│   ├── calibration.md
│   └── api-reference.md
└── README.md
```

## Milestones & Timeline

### Week 1-2: Project Setup & Hardware Ordering
- [x] Complete HW2 requirements
- [x] Create GitHub repositories
- [x] Order hardware components
- [ ] Set up development environment

### Week 3-4: MVP Development
- [ ] Get individual sensors working
- [ ] Display readings on OLED
- [ ] Basic web dashboard
- [ ] Local data logging
- [ ] **PPP Presentation**

### Week 5-6: Smart Control
- [ ] Implement MQTT communication
- [ ] Smart plug integration
- [ ] Automated purifier control
- [ ] Alert system implementation

### Week 7-8: Data Collection
- [ ] Deploy system in bedroom
- [ ] Collect 4+ weeks of data
- [ ] Implement sleep quality tracking
- [ ] Build data visualization

### Week 9-10: Mobile & Multi-Room
- [ ] Develop PWA mobile app
- [ ] Add historical data views
- [ ] Multi-room monitoring support
- [ ] Cloud sync implementation

### Week 11-12: AI/ML & Polish
- [ ] Train ML sleep quality model
- [ ] Implement predictive automation
- [ ] Generate health insights
- [ ] Final testing & documentation
- [ ] **Final Presentation**

## Research & References

### Key Findings
1. Air purifier built-in sensors measure air at the purifier (cleanest spot), not breathing zone
2. PM2.5/NO2 pollution increases sleep issues by 50-60%
3. CO2 above 1000 ppm significantly reduces cognitive performance
4. Multi-room air quality varies by 30-40% even with doors open

### Sources
- [Location Bias in Purifier Sensors](https://smartairfilters.com/en/blog/air-purifiers-with-built-in-air-quality-monitors-bad/)
- [Air Quality Impact on Sleep](https://www.clarity.io/blog/how-does-poor-air-quality-affect-sleep)
- [Low-Cost Sensor Calibration](https://amt.copernicus.org/articles/19/603/2026/)
- [Multi-Room Air Quality Dynamics](https://smartairfilters.com/en/blog/air-purifier-living-room-clean-entire-house/)

## Contributing

This is an individual academic project, but feedback and suggestions are welcome!

## License

MIT License - See LICENSE file for details

## Author

**Mausam Shrestha**
- GitHub: [@shresthamausam07](https://github.com/shresthamausam07)
- Course: CSC 494 - IoT (Spring 2026)
- Institution: Northern Kentucky University

## Acknowledgments

- Course instructor and teaching assistants
- Open source sensor libraries community
- AI assistance from Claude (Anthropic) for learning and development
- Research papers and articles cited above

---

**Note**: This project is for educational purposes. The device is not a certified medical device and should not be used for clinical decision-making.
