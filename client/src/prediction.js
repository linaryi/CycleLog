import { utcMidnight, MS_PER_DAY, logsInCycle } from './stats'
import { symptomByKey } from './symptomCatalog'
import { moodEmotionByName } from './moodCatalog'

// A "cycle interval" is the gap between consecutive cycle START dates —
// the medical definition of cycle length (typically ~28 days).
// Needs at least 2 cycles to produce a single interval.
export function avgCycleIntervalDays(cycles) {
  const starts = cycles
    .map(c => utcMidnight(c.startDate))
    .sort((a, b) => a - b)
  if (starts.length < 2) return null
  const gaps = []
  for (let i = 1; i < starts.length; i++) {
    gaps.push((starts[i] - starts[i - 1]) / MS_PER_DAY)
  }
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
}

// Predict the next cycle start, anchored on the most recent start date.
// Prefers real history (avg interval); falls back to the user's typical length.
// Returns null when there's no anchor (no cycles logged at all).
export function predictNextCycle(cycles, typicalCycleLengthDays, today = new Date()) {
  if (!cycles.length) return null
  const lastStart = Math.max(...cycles.map(c => utcMidnight(c.startDate)))

  const historyInterval = avgCycleIntervalDays(cycles)
  const interval = historyInterval ?? typicalCycleLengthDays
  if (!interval) return null

  const predicted = lastStart + interval * MS_PER_DAY
  return {
    date: new Date(predicted),
    daysUntil: Math.round((predicted - utcMidnight(today)) / MS_PER_DAY),
    intervalDays: interval,
    basis: historyInterval != null ? 'history' : 'typical',
    cycleCount: cycles.length,
  }
}

// For each cycle day N: how often each symptom/mood occurred on that day across
// past (ended) cycles, as { seen, outOf }. outOf = cycles long enough to have a day N.
export function likelihoodByCycleDay(cycles, symptoms, topPerDay = 3) {
  const ended = cycles.filter(c => c.endDate)
  if (!ended.length) return []

  const dayBuckets = {} // day -> { symptoms: {key: count}, moods: {name: count} }
  let maxDay = 0

  for (const cycle of ended) {
    const start = utcMidnight(cycle.startDate)
    for (const log of logsInCycle(symptoms, cycle)) {
      const day = Math.floor((utcMidnight(log.date) - start) / MS_PER_DAY) + 1
      maxDay = Math.max(maxDay, day)
      dayBuckets[day] ??= { symptoms: {}, moods: {} }
      for (const e of log.entries ?? []) {
        dayBuckets[day].symptoms[e.key] = (dayBuckets[day].symptoms[e.key] ?? 0) + 1
      }
      for (const m of log.moods ?? []) {
        dayBuckets[day].moods[m] = (dayBuckets[day].moods[m] ?? 0) + 1
      }
    }
  }

  const cyclesWithDay = (day) => ended.filter(c => {
    const len = Math.floor((utcMidnight(c.endDate) - utcMidnight(c.startDate)) / MS_PER_DAY) + 1
    return len >= day
  }).length

  const result = []
  for (let day = 1; day <= maxDay; day++) {
    const bucket = dayBuckets[day]
    if (!bucket) continue
    const outOf = cyclesWithDay(day)
    const rank = (counts) => Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topPerDay)
    result.push({
      day,
      outOf,
      symptoms: rank(bucket.symptoms).map(([key, seen]) => ({
        key, label: symptomByKey[key]?.label ?? key, seen, outOf,
      })),
      moods: rank(bucket.moods).map(([name, seen]) => ({
        name, color: moodEmotionByName[name]?.color ?? '#B8B8B8', seen, outOf,
      })),
    })
  }
  return result
}
