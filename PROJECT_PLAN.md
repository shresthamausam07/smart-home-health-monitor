# Smart Home Health Monitor - Project Plan

**Project**: Smart Home Health Monitor
**Student**: Mausam Shrestha
**Course**: CSC 494 - IoT (Spring 2026)
**Duration**: 14 weeks (January 13 - April 24, 2026)

---

## Executive Summary

This project develops an intelligent IoT air quality monitoring system that addresses critical limitations in commercial air purifiers. The system will monitor CO2, PM2.5, VOC, temperature, and humidity at breathing zone height (not at the purifier), providing accurate health insights and smart automation through machine learning.

**Key Differentiators**:
- Sensors placed where users breathe, not at purifier (eliminates location bias)
- Multi-parameter monitoring (5 sensors vs typical 1)
- Works with any purifier via smart plug
- ML-based sleep quality correlation
- Cost: $88 vs $200-400 for commercial alternatives

---

## Project Phases & Milestones

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: January 13-19
**Milestone**: Project Planning Complete

**Tasks**:
- [x] Complete HW2 requirements
- [x] Create GitHub repositories
- [x] Write README files
- [x] Research sensor options and pricing
- [ ] Order hardware components

**Deliverables**:
- GitHub repositories created
- Project documentation complete
- Hardware ordered

**Success Criteria**:
- All HW2 rubric items checked
- Hardware order placed by January 19

---

#### Week 2: January 20-26
**Milestone**: Development Environment Ready

**Tasks**:
- [ ] Set up PlatformIO development environment
- [ ] Install required libraries
- [ ] Configure Git workflow
- [ ] Create project folder structure
- [ ] Set up Firebase project (for future use)
- [ ] Begin learning React Native basics with AI

**Deliverables**:
- Working development environment
- Code repository structure
- Initial learning log entries

**Success Criteria**:
- Can compile and upload basic ESP32 program
- Project structure matches README specification

---

#### Week 3: January 27 - February 2
**Milestone**: Individual Sensors Working

**Tasks**:
- [ ] Test MH-Z19B CO2 sensor independently
- [ ] Test PMS5003 PM2.5 sensor independently
- [ ] Test SGP40 VOC sensor independently
- [ ] Test AHT20 temp/humidity sensor independently
- [ ] Test OLED display
- [ ] Document sensor behaviors and quirks

**Deliverables**:
- Working sensor drivers for each sensor
- Test code for individual sensors
- Sensor documentation

**Success Criteria**:
- Each sensor provides readings independently
- Readings appear reasonable (within expected ranges)

---

#### Week 4: February 3-9
**Milestone**: MVP Ready + PPP Presentation

**Tasks**:
- [ ] Integrate all sensors on single ESP32
- [ ] Display readings on OLED (rotating display)
- [ ] Implement basic web server for dashboard
- [ ] Create simple HTML dashboard
- [ ] Prepare PPP presentation
- [ ] Deliver PPP presentation

**Deliverables**:
- Integrated sensor system
- Basic web dashboard
- PPP presentation slides
- Live demo

**Success Criteria**:
- All sensors working simultaneously
- Web dashboard accessible on local network
- Successful PPP presentation with live demo

---

### Phase 2: Smart Control & Data Collection (Weeks 5-8)

#### Week 5: February 10-16
**Milestone**: Smart Plug Integration

**Tasks**:
- [ ] Set up MQTT broker (Mosquitto or cloud-based)
- [ ] Implement MQTT client on ESP32
- [ ] Configure Tasmota smart plug
- [ ] Test purifier control via MQTT
- [ ] Implement automation logic (PM2.5 > 35 = ON)

**Deliverables**:
- MQTT communication working
- Smart plug controllable from ESP32
- Basic automation active

**Success Criteria**:
- Purifier turns on/off based on air quality readings
- <2 second control latency

---

#### Week 6: February 17-23
**Milestone**: Data Logging & Persistence

**Tasks**:
- [ ] Implement local data logging (SD card or SPIFFS)
- [ ] Set up Firebase Firestore
- [ ] Implement cloud sync
- [ ] Create data schemas
- [ ] Test data integrity

**Deliverables**:
- Local and cloud data storage
- Historical data accessible
- Data backup system

**Success Criteria**:
- System logs data every 1 minute
- Data survives ESP32 restart
- Cloud sync operational

---

#### Week 7: February 24 - March 2
**Milestone**: Alert System

**Tasks**:
- [ ] Implement alert logic (CO2 > 1000, PM2.5 > 35)
- [ ] Set up Firebase Cloud Messaging
- [ ] Test push notifications
- [ ] Create alert configuration interface
- [ ] Deploy system in bedroom for continuous operation

**Deliverables**:
- Working alert system
- Push notifications functional
- System deployed and running 24/7

**Success Criteria**:
- Receive alerts on phone when thresholds exceeded
- System runs continuously without crashes

---

#### Week 8: March 3-9
**Milestone**: Data Visualization

**Tasks**:
- [ ] Enhance web dashboard with charts
- [ ] Implement historical data views (hourly, daily, weekly)
- [ ] Add trend analysis
- [ ] Begin sleep quality tracking interface
- [ ] Collect first week of continuous data

**Deliverables**:
- Enhanced dashboard with graphs
- 1 week of continuous data collected
- Sleep quality logging interface

**Success Criteria**:
- Dashboard shows 24-hour historical graphs
- At least 5 days of continuous operation
- Sleep quality data being logged

---

### Phase 3: Mobile & Intelligence (Weeks 9-11)

#### Week 9: March 10-16
**Milestone**: Mobile App MVP

**Tasks**:
- [ ] Create Progressive Web App (PWA)
- [ ] Implement responsive design
- [ ] Add real-time data display
- [ ] Implement push notification handling
- [ ] Test on iOS and Android

**Deliverables**:
- Functional PWA mobile app
- Works on multiple devices
- Real-time updates

**Success Criteria**:
- App accessible from phone browser
- Real-time data updates working
- Notifications display properly

---

#### Week 10: March 17-23 (Spring Break - March 17-21)
**Milestone**: Multi-Room Support (Optional)

**Tasks**:
- [ ] Design multi-room architecture
- [ ] Test with second ESP32 unit (if available)
- [ ] Implement room selection in UI
- [ ] Compare room-to-room variations

**Deliverables**:
- Multi-room monitoring capability (if time permits)
- Documentation of air quality variations

**Success Criteria**:
- Can monitor 2+ locations independently
- Dashboard shows per-room data

---

#### Week 11: March 24-30
**Milestone**: Machine Learning Model

**Tasks**:
- [ ] Export 4+ weeks of data for analysis
- [ ] Perform exploratory data analysis
- [ ] Train sleep quality correlation model
- [ ] Evaluate model accuracy
- [ ] Implement predictive automation

**Deliverables**:
- Trained ML model
- Model evaluation report
- Predictive features in app

**Success Criteria**:
- Model achieves >70% accuracy
- Can predict sleep quality from air metrics
- Actionable insights generated

---

### Phase 4: Polish & Presentation (Weeks 12-14)

#### Week 12: March 31 - April 6
**Milestone**: System Optimization

**Tasks**:
- [ ] Optimize sensor calibration
- [ ] Improve automation logic
- [ ] Enhance UI/UX
- [ ] Fix bugs and edge cases
- [ ] Improve error handling

**Deliverables**:
- Polished, stable system
- Bug fixes implemented
- Performance optimizations

**Success Criteria**:
- System runs 7+ days without intervention
- No critical bugs remaining

---

#### Week 13: April 7-13
**Milestone**: Documentation & Testing

**Tasks**:
- [ ] Complete all documentation
- [ ] Write installation guide
- [ ] Create user manual
- [ ] Perform final testing
- [ ] Generate health insights report

**Deliverables**:
- Complete documentation
- Installation/setup guide
- User manual
- Testing report
- Health insights from collected data

**Success Criteria**:
- Documentation covers all features
- Another person can set up system from docs

---

#### Week 14: April 14-24
**Milestone**: Final Presentation

**Tasks**:
- [ ] Prepare final presentation
- [ ] Create demo video
- [ ] Compile results and findings
- [ ] Prepare project showcase
- [ ] Deliver final presentation
- [ ] Submit final project

**Deliverables**:
- Final presentation slides
- Demo video
- Complete project repository
- Final report with results

**Success Criteria**:
- Successful final presentation
- All project requirements met
- Code and documentation complete

---

## Feature Breakdown

### Core Features (Must Have)
1. **Multi-Sensor Monitoring**: CO2, PM2.5, VOC, temp, humidity
2. **Real-Time Display**: OLED showing current readings
3. **Web Dashboard**: Browser-based interface with live data
4. **Smart Control**: Automated purifier control via smart plug
5. **Data Logging**: Persistent storage of historical data
6. **Alert System**: Notifications when thresholds exceeded

### Enhanced Features (Should Have)
7. **Mobile App**: PWA for mobile access
8. **Data Visualization**: Charts and trends
9. **Sleep Quality Tracking**: Manual logging and correlation
10. **Cloud Sync**: Firebase integration
11. **Calibration**: Sensor accuracy improvements

### Advanced Features (Nice to Have)
12. **Machine Learning**: Predictive sleep quality model
13. **Multi-Room**: Support for multiple monitors
14. **Predictive Automation**: ML-based purifier control
15. **Health Insights**: Weekly reports and recommendations

---

## Risk Management

### Technical Risks

**Risk 1: Sensor Accuracy Issues**
- **Probability**: High
- **Impact**: High
- **Mitigation**: Budget extra time for calibration, implement multiple filtering techniques, accept ±20% accuracy as documented limitation

**Risk 2: Hardware Delivery Delays**
- **Probability**: Medium
- **Impact**: High
- **Mitigation**: Order immediately, have backup suppliers, can develop software components while waiting

**Risk 3: MQTT/Network Reliability**
- **Probability**: Medium
- **Impact**: Medium
- **Mitigation**: Implement local fallback, queue messages, auto-reconnect logic

**Risk 4: ML Model Insufficient Data**
- **Probability**: Medium
- **Impact**: Low
- **Mitigation**: Start data collection early, can use simpler correlation analysis if ML doesn't work

**Risk 5: Time Constraints**
- **Probability**: High
- **Impact**: Medium
- **Mitigation**: Focus on core features first, make advanced features optional, time-box ML work

### Mitigation Strategies
1. **Modular Development**: Each component works independently
2. **Early Testing**: Test hardware immediately upon arrival
3. **Parallel Work**: Software development while hardware ships
4. **Simplified MVP**: Get basic version working before adding complexity
5. **Regular Check-ins**: Weekly progress reviews to catch issues early

---

## Success Metrics & KPIs

### Technical Metrics
- **Sensor Accuracy**: ±20% of reference monitors
- **Uptime**: 99% over 4-week period
- **Response Time**: <500ms for dashboard
- **Control Latency**: <2s for purifier commands
- **Data Collection**: 4+ weeks continuous operation

### Learning Metrics
- **Mobile App**: Functional PWA deployed
- **Sensor Integration**: 5 sensors working simultaneously
- **Code Quality**: All code documented and version controlled
- **Problem Solving**: 20+ AI-assisted learning sessions documented

### Project Metrics
- **PPP Presentation**: Successful with live demo
- **Final Presentation**: Comprehensive results
- **Documentation**: Complete and clear
- **Repository**: Professional, organized, well-documented

---

## Weekly Time Commitment

**Estimated Hours per Week**: 10-12 hours

**Breakdown**:
- Hardware/Firmware Development: 4-5 hours
- Software Development (Web/Mobile): 3-4 hours
- Learning with AI: 2 hours
- Documentation/Testing: 1-2 hours

**Total Project Hours**: 140-168 hours over 14 weeks

---

## Burndown Chart (For PPP)

### Story Points Allocation
- **Total Story Points**: 100

**Phase 1 (Weeks 1-4)**: 30 points
- Project setup: 5 points
- Individual sensors: 10 points
- Integration: 10 points
- PPP preparation: 5 points

**Phase 2 (Weeks 5-8)**: 35 points
- Smart control: 10 points
- Data logging: 10 points
- Alerts: 5 points
- Visualization: 10 points

**Phase 3 (Weeks 9-11)**: 25 points
- Mobile app: 15 points
- ML model: 10 points

**Phase 4 (Weeks 12-14)**: 10 points
- Polish: 5 points
- Documentation: 3 points
- Final presentation: 2 points

### Expected Burndown
- Week 4: 70 points remaining (PPP milestone)
- Week 8: 35 points remaining (Mid-semester)
- Week 12: 10 points remaining
- Week 14: 0 points remaining (Complete)

---

## Dependencies

### External Dependencies
- Hardware delivery (Week 1-2)
- Firebase account setup (Week 2)
- Course feedback on PPP (Week 4)
- Continuous data collection period (Weeks 7-11)

### Technical Dependencies
1. ESP32 must work before sensor integration
2. Individual sensors must work before integration
3. Basic system must work before smart control
4. Data collection required before ML model
5. Web dashboard required before mobile app

---

## Team Structure

As this is an individual project, I am managing three "software engineers" (AI-assisted development personas):

### Engineer 1: "Alex" - Hardware Engineer
**Responsibilities**:
- Sensor integration and testing
- Hardware debugging
- Calibration procedures
- Circuit design

**Weekly Tracking**: Document sensor issues, solutions, accuracy improvements

### Engineer 2: "Sam" - Software Engineer
**Responsibilities**:
- Web dashboard development
- Mobile app development
- API design
- Database schema

**Weekly Tracking**: Features completed, bugs fixed, code quality

### Engineer 3: "Jordan" - ML Engineer
**Responsibilities**:
- Data analysis
- ML model development
- Insights generation
- Predictive algorithms

**Weekly Tracking**: Data collected, models trained, accuracy metrics

---

## Alignment with Course Schedule

**PPP (Week 4)**: MVP with live demo ready
**Mid-Semester (Week 7-8)**: Data collection phase, core features complete
**Final Weeks (Week 13-14)**: Polish, documentation, final presentation

This plan aligns with typical ASE project ceremonies and the course timeline.

---

## Approval & Sign-off

**Student**: Mausam Shrestha
**Date**: February 1, 2026

**Instructor Approval**: _________________
**Date**: _________________

---

**Last Updated**: February 1, 2026
**Version**: 1.0
