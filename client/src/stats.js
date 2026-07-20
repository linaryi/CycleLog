import { symptomByKey } from './symptomCatalog'
import { moodEmotionByName } from './moodCatalog'

export const MS_PER_DAY = 1000 * 60 * 60 * 24

export function utcMidnight(date) {
  const d = new Date(date)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// inclusive day count: a cycle from 6/25 to 7/1 is 7 days
export function cycleLengthDays(cycle) {
  return Math.floor((utcMidnight(cycle.endDate) - utcMidnight(cycle.startDate)) / MS_PER_DAY) + 1
}

export function cycleStats(cycles) {
  const ended = cycles.filter(c => c.endDate)
  if (!ended.length) return null
  const lengths = ended.map(cycleLengthDays)
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  return {
    count: ended.length,
    avgLength: Math.round(avg * 10) / 10,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
  }
}

// days since the most recent ended cycle; null while a cycle is active or with no history
export function daysSinceLastCycle(cycles, today = new Date()) {
  if (cycles.some(c => !c.endDate)) return null
  const ended = cycles.filter(c => c.endDate)
  if (!ended.length) return null
  const lastEnd = Math.max(...ended.map(c => utcMidnight(c.endDate)))
  return Math.floor((utcMidnight(today) - lastEnd) / MS_PER_DAY)
}

// count = number of logged days the symptom appears on
export function topSymptoms(symptoms) {
  const counts = {}
  for (const log of symptoms) {
    for (const entry of log.entries ?? []) {
      counts[entry.key] = (counts[entry.key] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([key, count]) => ({ key, label: symptomByKey[key]?.label ?? key, count }))
    .sort((a, b) => b.count - a.count)
}

export function topMoods(symptoms) {
  const counts = {}
  for (const log of symptoms) {
    for (const name of log.moods ?? []) {
      counts[name] = (counts[name] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, color: moodEmotionByName[name]?.color ?? '#B8B8B8', count }))
    .sort((a, b) => b.count - a.count)
}

// ---- range/scope helpers: filtering = choosing which arrays to feed the stat functions ----

export function logsInRange(symptoms, startMs, endMs) {
  return symptoms.filter(s => {
    const t = utcMidnight(s.date)
    return t >= startMs && t <= endMs
  })
}

// membership rule: a cycle belongs to the range its START date falls in
export function cyclesStartedInRange(cycles, startMs, endMs) {
  return cycles.filter(c => {
    const t = utcMidnight(c.startDate)
    return t >= startMs && t <= endMs
  })
}

export function logsInCycle(symptoms, cycle) {
  const start = utcMidnight(cycle.startDate)
  const end = cycle.endDate ? utcMidnight(cycle.endDate) : Infinity
  return logsInRange(symptoms, start, end)
}

export function monthRange(year, monthIndex) {
  return [Date.UTC(year, monthIndex, 1), Date.UTC(year, monthIndex + 1, 0)]
}

export function yearRange(year) {
  return [Date.UTC(year, 0, 1), Date.UTC(year, 11, 31)]
}

// sorted unique { year, month } pairs that have logs, newest first — drives the month dropdown
export function availableMonths(symptoms) {
  const seen = new Map()
  for (const log of symptoms) {
    const d = new Date(log.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    seen.set(key, { year: d.getUTCFullYear(), month: d.getUTCMonth() })
  }
  return [...seen.values()].sort((a, b) => b.year - a.year || b.month - a.month)
}

export function availableYears(symptoms) {
  const years = new Set(symptoms.map(s => new Date(s.date).getUTCFullYear()))
  return [...years].sort((a, b) => b - a)
}

// tiles for the single-cycle view (avg/min/max are meaningless for one cycle)
export function perCycleSummary(cycle, symptoms) {
  const logs = logsInCycle(symptoms, cycle)
  const symptomKeys = new Set(logs.flatMap(l => (l.entries ?? []).map(e => e.key)))
  const moodNames = new Set(logs.flatMap(l => l.moods ?? []))
  return {
    lengthDays: cycle.endDate ? cycleLengthDays(cycle) : null,
    daysLogged: logs.length,
    symptomCount: symptomKeys.size,
    moodCount: moodNames.size,
  }
}

// Categorical chart colors, deepened versions of the app's mood-color families.
// Validated (dataviz six checks) against a white surface — assign in this fixed order.
export const CHART_COLORS = ['#D25058', '#4A88C9', '#4F9D5C', '#D29A2F', '#8B7EC8']

// Rows shaped for a stacked bar chart: [{ day: 1, cramps: 2, headache: 1 }, ...]
// Only the overall top-5 symptoms are included so the chart stays readable.
export function symptomsByCycleDay(cycles, symptoms) {
  const top5 = topSymptoms(symptoms).slice(0, 5)
  const topKeys = top5.map(s => s.key)

  const byDay = {}
  let maxDay = 0
  for (const log of symptoms) {
    const t = utcMidnight(log.date)
    const cycle = cycles.find(c => {
      const start = utcMidnight(c.startDate)
      const end = c.endDate ? utcMidnight(c.endDate) : Infinity
      return t >= start && t <= end
    })
    if (!cycle) continue
    const day = Math.floor((t - utcMidnight(cycle.startDate)) / MS_PER_DAY) + 1
    maxDay = Math.max(maxDay, day)
    byDay[day] ??= {}
    for (const entry of log.entries ?? []) {
      if (!topKeys.includes(entry.key)) continue
      byDay[day][entry.key] = (byDay[day][entry.key] ?? 0) + 1
    }
  }

  // continuous axis: include empty days so Day 3 doesn't sit next to Day 7
  const data = []
  for (let day = 1; day <= maxDay; day++) {
    data.push({ day, ...(byDay[day] ?? {}) })
  }

  return {
    data,
    series: top5.map((s, i) => ({ key: s.key, label: s.label, color: CHART_COLORS[i] })),
  }
}
