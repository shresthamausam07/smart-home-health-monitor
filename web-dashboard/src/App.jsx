import { useEffect, useMemo, useState } from 'react'
import { getApps, initializeApp } from 'firebase/app'
import { getDatabase, limitToLast, onValue, query, ref } from 'firebase/database'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const RTDB_HOST = import.meta.env.VITE_FIREBASE_HOST
const RTDB_AUTH = import.meta.env.VITE_FIREBASE_AUTH
const CO2_THRESHOLD = 1000
const PM25_THRESHOLD = 35
const VOC_THRESHOLD = 2500
const STALE_AFTER_SECONDS = 120

// Sensors that are physically not connected to the hardware.
// They will be shown as "Not connected" in the status grid and excluded from alerts.
const DISCONNECTED_SENSORS = new Set([])

const metricLabels = [
  { key: 'temperature', label: 'Temperature', unit: 'C' },
  { key: 'humidity', label: 'Humidity', unit: '%' },
  { key: 'co2', label: 'CO2', unit: 'ppm' },
  { key: 'pm25', label: 'PM2.5', unit: 'ug/m3' },
  { key: 'voc', label: 'VOC', unit: 'raw' },
]

const rangeOptions = [
  { key: '1h', label: '1 Hour' },
  { key: '24h', label: '24 Hours' },
  { key: '7d', label: '7 Days' },
  { key: 'all', label: 'All Data' },
]

const rangeMs = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  all: Infinity,
}

const chartMetricOptions = [
  { key: 'co2', label: 'CO2', unit: 'ppm', color: '#1f6feb' },
  { key: 'pm25', label: 'PM2.5', unit: 'ug/m3', color: '#9333ea' },
  { key: 'voc', label: 'VOC', unit: 'raw', color: '#ea580c' },
  { key: 'temperature', label: 'Temperature', unit: 'C', color: '#16a34a' },
  { key: 'humidity', label: 'Humidity', unit: '%', color: '#0ea5e9' },
]

const MIN_REASONABLE_EPOCH_MS = Date.parse('2020-01-01T00:00:00Z')

function normalizeTimestamp(rawTimestamp) {
  const n = Number(rawTimestamp || 0)
  if (!n) {
    return 0
  }
  // Convert seconds to ms if data source sends epoch seconds.
  if (n > 1_000_000_000 && n < 10_000_000_000) {
    return n * 1000
  }
  // Ignore impossible old timestamps (e.g., millis since boot).
  if (n < MIN_REASONABLE_EPOCH_MS) {
    return 0
  }
  return n
}

function getVocStatus(value) {
  const v = Number(value)
  if (!Number.isFinite(v) || v <= 0) return null
  if (v < 300)  return { label: 'Clean',     color: '#16a34a' }
  if (v < 800)  return { label: 'Normal',    color: '#65a30d' }
  if (v < 1500) return { label: 'Moderate',  color: '#d97706' }
  if (v < 2500) return { label: 'High',      color: '#ea580c' }
  return           { label: 'Very High', color: '#dc2626' }
}

function effectiveTs(reading) {
  return reading.timestamp || reading.ingestedAt || 0
}

// Number of consecutive readings required to flag a stuck or no-signal sensor.
const HEALTH_WINDOW = 5

/**
 * Inspects the last HEALTH_WINDOW readings for a sensor key and returns a
 * health issue if one is detected, or null if the sensor looks fine.
 */
function detectSensorHealth(key, recentReadings) {
  if (recentReadings.length < HEALTH_WINDOW) return null
  const window = recentReadings.slice(-HEALTH_WINDOW)
  const values = window.map((r) => r[key])
  if (values.every((v) => v === 0)) {
    return { state: 'inactive', detail: 'No signal — sensor may be disconnected' }
  }
  if (values.every((v) => v === values[0])) {
    return { state: 'warning', detail: `Stuck at ${values[0]}` }
  }
  return null
}

function formatMetricValue(key, value) {
  const n = Number(value)
  if (!Number.isFinite(n)) {
    return '--'
  }
  if (key === 'temperature' || key === 'humidity' || key === 'pm25') {
    return n.toFixed(1)
  }
  return `${Math.round(n)}`
}

function App() {
  const missingConfig = !RTDB_HOST || !RTDB_AUTH
  const [readings, setReadings] = useState([])
  const [status, setStatus] = useState(missingConfig ? 'error' : 'loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [activeRange, setActiveRange] = useState('24h')
  const [activeChartMetric, setActiveChartMetric] = useState('co2')
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [sleepDate, setSleepDate] = useState(() => new Date().toISOString().split('T')[0])
  const [sleepScore, setSleepScore] = useState(7)
  const [sleepLogs, setSleepLogs] = useState([])
  const [sleepSubmitting, setSleepSubmitting] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (missingConfig) {
      return
    }

    const appName = 'dashboard-client'
    const existingApp = getApps().find((item) => item.name === appName)
    const app =
      existingApp ||
      initializeApp(
        {
          apiKey: RTDB_AUTH,
          databaseURL: `https://${RTDB_HOST}`,
        },
        appName,
      )
    const db = getDatabase(app)
    const readingsQuery = query(ref(db, 'sensor_readings'), limitToLast(600))

    const unsubscribe = onValue(
      readingsQuery,
      (snapshot) => {
        const payload = snapshot.val() || {}
        const entries = Object.entries(payload)
        const now = Date.now()
        const records = entries
          .map(([key, value], index) => ({
            id: key,
            ...value,
            timestamp: normalizeTimestamp(value?.timestamp),
            // Fallback for legacy rows with invalid timestamps.
            ingestedAt: now - (entries.length - index) * 1000,
            co2: Number(value?.co2 ?? 0),
            pm25: Number(value?.pm25 ?? 0),
            voc: Number(value?.voc ?? 0),
            temperature: Number(value?.temperature ?? 0),
            humidity: Number(value?.humidity ?? 0),
          }))
          .sort((a, b) => effectiveTs(a) - effectiveTs(b))
        setReadings(records)
        setStatus('ready')
        setErrorMessage('')
      },
      (error) => {
        setStatus('error')
        setErrorMessage(`Realtime subscription failed: ${error.message}`)
      },
    )

    const sleepLogsQuery = query(ref(db, 'sleep_logs'), limitToLast(7))
    const unsubscribeSleep = onValue(sleepLogsQuery, (snapshot) => {
      const payload = snapshot.val() || {}
      const entries = Object.entries(payload)
        .map(([date, data]) => ({ date, score: Number(data.score || 0) }))
        .sort((a, b) => b.date.localeCompare(a.date))
      setSleepLogs(entries)
    })

    return () => {
      unsubscribe()
      unsubscribeSleep()
    }
  }, [missingConfig])

  const filteredReadings = useMemo(() => {
    if (!readings.length) {
      return []
    }
    const latestTs = effectiveTs(readings[readings.length - 1])
    const windowMs = rangeMs[activeRange]
    if (windowMs === Infinity) {
      return readings
    }
    return readings.filter((item) => latestTs - effectiveTs(item) <= windowMs)
  }, [readings, activeRange])

  const latest = filteredReadings[filteredReadings.length - 1] || readings[readings.length - 1] || null
  const activeMetricMeta =
    chartMetricOptions.find((option) => option.key === activeChartMetric) || chartMetricOptions[0]
  const chartData = useMemo(
    () =>
      filteredReadings.map((item) => ({
        timestamp: effectiveTs(item),
        value: Number(item[activeChartMetric] || 0),
      })),
    [filteredReadings, activeChartMetric],
  )

  const alerts = useMemo(() => {
    if (!latest) {
      return []
    }
    return [
      {
        key: 'co2',
        label: 'CO2',
        current: latest.co2,
        threshold: CO2_THRESHOLD,
        triggered: Number(latest.co2 ?? 0) >= CO2_THRESHOLD,
      },
      {
        key: 'pm25',
        label: 'PM2.5',
        current: latest.pm25,
        threshold: PM25_THRESHOLD,
        triggered: !DISCONNECTED_SENSORS.has('pm25') && Number(latest.pm25 ?? 0) >= PM25_THRESHOLD,
      },
      {
        key: 'voc',
        label: 'VOC',
        current: latest.voc,
        threshold: VOC_THRESHOLD,
        triggered: !DISCONNECTED_SENSORS.has('voc') && Number(latest.voc ?? 0) >= VOC_THRESHOLD,
      },
    ]
  }, [latest])

  const triggeredCount = alerts.filter((item) => item.triggered).length

  const ledChartData = useMemo(
    () => filteredReadings.map((r) => ({
      timestamp: effectiveTs(r),
      on: r.purifier ? 1 : 0,
      off: r.purifier ? 0 : 1,
    })),
    [filteredReadings],
  )

  const alertHistory = useMemo(() => {
    if (!filteredReadings.length) {
      return []
    }

    const events = []
    const pushEvent = (label, key, threshold, prev, curr) => {
      const prevTriggered = Number(prev?.[key] || 0) >= threshold
      const currTriggered = Number(curr?.[key] || 0) >= threshold
      if (!prevTriggered && currTriggered) {
        events.push({
          id: `${key}-${effectiveTs(curr)}`,
          label,
          value: curr?.[key],
          threshold,
          timestamp: effectiveTs(curr),
        })
      }
    }

    for (let i = 1; i < filteredReadings.length; i += 1) {
      const prev = filteredReadings[i - 1]
      const curr = filteredReadings[i]
      pushEvent('CO2', 'co2', CO2_THRESHOLD, prev, curr)
      if (!DISCONNECTED_SENSORS.has('pm25')) {
        pushEvent('PM2.5', 'pm25', PM25_THRESHOLD, prev, curr)
      }
      if (!DISCONNECTED_SENSORS.has('voc')) {
        pushEvent('VOC', 'voc', VOC_THRESHOLD, prev, curr)
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, 10)
  }, [filteredReadings])

  const lastUpdated = latest
    ? new Date(effectiveTs(latest)).toLocaleString()
    : 'No readings yet'
  const dataAgeSeconds = latest
    ? Math.max(0, Math.round((nowMs - effectiveTs(latest)) / 1000))
    : null
  const dataFresh = dataAgeSeconds !== null && dataAgeSeconds <= STALE_AFTER_SECONDS

  const sensorStatuses = useMemo(() => {
    if (!latest) {
      return [
        { key: 'temperature', label: 'Temperature', state: 'inactive', detail: 'No data' },
        { key: 'humidity', label: 'Humidity', state: 'inactive', detail: 'No data' },
        { key: 'co2', label: 'CO2', state: 'inactive', detail: 'No data' },
        { key: 'pm25', label: 'PM2.5', state: 'inactive', detail: 'No data' },
        { key: 'voc', label: 'VOC', state: 'inactive', detail: 'No data' },
      ]
    }

    const checks = [
      {
        key: 'temperature',
        label: 'Temperature',
        valid: Number.isFinite(latest.temperature) && latest.temperature > -40 && latest.temperature < 90,
        value: `${formatMetricValue('temperature', latest.temperature)} C`,
      },
      {
        key: 'humidity',
        label: 'Humidity',
        valid: Number.isFinite(latest.humidity) && latest.humidity >= 0 && latest.humidity <= 100,
        value: `${formatMetricValue('humidity', latest.humidity)} %`,
      },
      {
        key: 'co2',
        label: 'CO2',
        valid: Number.isFinite(latest.co2) && latest.co2 > 0,
        value: `${formatMetricValue('co2', latest.co2)} ppm`,
      },
      {
        key: 'pm25',
        label: 'PM2.5',
        // pm25 == 0 means no sensor data; require a positive reading to be valid.
        valid: Number.isFinite(latest.pm25) && latest.pm25 > 0,
        value: `${formatMetricValue('pm25', latest.pm25)} ug/m3`,
      },
      {
        key: 'voc',
        label: 'VOC',
        valid: Number.isFinite(latest.voc) && latest.voc > 0,
        value: `${formatMetricValue('voc', latest.voc)}`,
      },
    ]

    return checks.map((sensor) => {
      if (DISCONNECTED_SENSORS.has(sensor.key)) {
        return {
          key: sensor.key,
          label: sensor.label,
          state: 'inactive',
          detail: 'Not connected',
        }
      }
      if (!dataFresh) {
        return {
          key: sensor.key,
          label: sensor.label,
          state: 'inactive',
          detail: `Stale (${dataAgeSeconds}s old)`,
        }
      }
      const healthIssue = detectSensorHealth(sensor.key, readings)
      if (healthIssue) {
        return { key: sensor.key, label: sensor.label, ...healthIssue }
      }
      if (!sensor.valid) {
        return {
          key: sensor.key,
          label: sensor.label,
          state: 'warning',
          detail: `Invalid value: ${sensor.value}`,
        }
      }
      return {
        key: sensor.key,
        label: sensor.label,
        state: 'active',
        detail: sensor.value,
      }
    })
  }, [latest, dataFresh, dataAgeSeconds, readings])

  async function handleSleepLogSubmit(e) {
    e.preventDefault()
    if (!sleepDate) return
    setSleepSubmitting(true)
    try {
      const url = `https://${RTDB_HOST}/sleep_logs/${sleepDate}.json?auth=${RTDB_AUTH}`
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: Number(sleepScore), loggedAt: Date.now() }),
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
    } catch (err) {
      alert(`Failed to save sleep log: ${err.message}`)
    } finally {
      setSleepSubmitting(false)
    }
  }

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Smart Home Dashboard</h1>
          <p>Realtime air quality and environmental telemetry</p>
        </div>
        <span className={`status ${status}`}>{status === 'refreshing' ? 'updating' : status}</span>
      </header>

      {status === 'error' && (
        <p className="error">
          Could not load data:{' '}
          {errorMessage || 'Missing VITE_FIREBASE_HOST or VITE_FIREBASE_AUTH in .env.local'}
        </p>
      )}

      <section className="alerts">
        <article className="alertSummary">
          <p>Active alerts</p>
          <h2>{triggeredCount}</h2>
        </article>
        <div className="alertBadges">
          {alerts.map((alert) => (
            <span
              key={alert.key}
              className={alert.triggered ? 'alertBadge danger' : 'alertBadge ok'}
            >
              {alert.label}: {alert.current} / {alert.threshold}
            </span>
          ))}
        </div>
      </section>

      <section className="metrics">
        {metricLabels.map((metric) => {
          const vocStatus = metric.key === 'voc' && latest ? getVocStatus(latest.voc) : null
          return (
            <article key={metric.key} className="card">
              <p>{metric.label}</p>
              <h2>
                {latest ? formatMetricValue(metric.key, latest[metric.key]) : '--'}{' '}
                <small>{metric.unit}</small>
              </h2>
              {vocStatus && (
                <span className="vocStatus" style={{ color: vocStatus.color }}>
                  {vocStatus.label}
                </span>
              )}
            </article>
          )
        })}
      </section>

      <section className="chartCard">
        <h3>Sensor Status</h3>
        <div className="sensorStatusGrid">
          {sensorStatuses.map((sensor) => (
            <div key={sensor.key} className="sensorStatusCard">
              <div className="sensorStatusHead">
                <strong>{sensor.label}</strong>
                <span className={`sensorPill ${sensor.state}`}>{sensor.state}</span>
              </div>
              <p className="muted">{sensor.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="controls">
        <div className="rangeButtons">
          {rangeOptions.map((range) => (
            <button
              key={range.key}
              className={range.key === activeRange ? 'rangeBtn active' : 'rangeBtn'}
              onClick={() => setActiveRange(range.key)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="rangeButtons">
          {chartMetricOptions.map((option) => (
            <button
              key={option.key}
              className={option.key === activeChartMetric ? 'rangeBtn active' : 'rangeBtn'}
              onClick={() => setActiveChartMetric(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="chartCard">
        <h3>
          {activeMetricMeta.label} Trend <small>({activeMetricMeta.unit})</small>
        </h3>
        <div className="chartWrap">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                minTickGap={40}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleString()}
                formatter={(value) => [
                  `${formatMetricValue(activeChartMetric, value)} ${activeMetricMeta.unit}`,
                  activeMetricMeta.label,
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={activeMetricMeta.color}
                fill={`${activeMetricMeta.color}55`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="phase3Grid">
        <article className="chartCard">
          <h3>LED Control Timeline <small>(Purifier Demo)</small></h3>

          {/* Current state badge — reflects the very latest reading instantly */}
          <div className="ledCurrentState">
            <span className={`ledStateBadge ${latest?.purifier ? 'on' : 'off'}`}>
              {latest?.purifier ? 'LED ON' : 'LED OFF'}
            </span>
            <span className="ledLiveStatus">
              {dataAgeSeconds === null ? 'no data' : dataAgeSeconds === 0 ? 'just now' : `${dataAgeSeconds}s ago`}
              {' · '}{filteredReadings.length} readings
            </span>
          </div>

          {ledChartData.length === 0 ? (
            <p className="muted">No data in selected range.</p>
          ) : (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={ledChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(v) => new Date(v).toLocaleTimeString()}
                  minTickGap={60}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v) => (v === 1 ? 'ON' : 'OFF')}
                  tick={{ fontSize: 11 }}
                  width={36}
                />
                <Tooltip
                  labelFormatter={(v) => new Date(v).toLocaleString()}
                  formatter={(v, name) => [v === 1 ? (name === 'on' ? 'ON' : 'OFF') : '', 'LED']}
                />
                <Area
                  type="stepAfter"
                  dataKey="off"
                  stroke="#ef4444"
                  fill="#ef444455"
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
                <Area
                  type="stepAfter"
                  dataKey="on"
                  stroke="#22c55e"
                  fill="#22c55e55"
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </article>

        <article className="chartCard">
          <h3>Alert History</h3>
          {alertHistory.length === 0 ? (
            <p className="muted">No threshold crossing events in selected range.</p>
          ) : (
            <ul className="historyList">
              {alertHistory.map((event) => (
                <li key={event.id}>
                  <strong>{event.label}</strong> crossed {event.threshold} with value {event.value}{' '}
                  <span>{new Date(event.timestamp).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="chartCard sleepLogger">
        <h3>Sleep Quality Log</h3>
        <p className="muted">Rate your sleep after waking up. Stored alongside air quality data for correlation.</p>
        <form className="sleepForm" onSubmit={handleSleepLogSubmit}>
          <label>
            Date
            <input
              type="date"
              value={sleepDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSleepDate(e.target.value)}
              required
            />
          </label>
          <label>
            Sleep quality
            <div className="sleepScoreRow">
              <input
                type="range"
                min={1}
                max={10}
                value={sleepScore}
                onChange={(e) => setSleepScore(Number(e.target.value))}
              />
              <span className="sleepScoreBadge">{sleepScore} / 10</span>
            </div>
          </label>
          <button type="submit" className="sleepSubmitBtn" disabled={sleepSubmitting}>
            {sleepSubmitting ? 'Saving…' : 'Save Entry'}
          </button>
        </form>

        {sleepLogs.length > 0 && (
          <table className="sleepTable">
            <thead>
              <tr><th>Date</th><th>Score</th><th>Quality</th></tr>
            </thead>
            <tbody>
              {sleepLogs.map((entry) => {
                const quality =
                  entry.score >= 8 ? { label: 'Good', color: '#16a34a' } :
                  entry.score >= 5 ? { label: 'Fair', color: '#d97706' } :
                                     { label: 'Poor', color: '#dc2626' }
                return (
                  <tr key={entry.date}>
                    <td>{entry.date}</td>
                    <td>{entry.score} / 10</td>
                    <td style={{ color: quality.color, fontWeight: 600 }}>{quality.label}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>

      <footer className="footer">
        <p>Records loaded: {readings.length}</p>
        <p>Records shown: {filteredReadings.length}</p>
        <p>Last updated: {lastUpdated}</p>
        <p>Data age: {dataAgeSeconds === null ? '--' : `${dataAgeSeconds}s`}</p>
      </footer>
    </main>
  )
}

export default App
