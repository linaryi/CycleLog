import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
} from 'recharts'
import { symptomByKey } from '../symptomCatalog'
import { moodEmotionByName } from '../moodCatalog'
import {
  MS_PER_DAY, utcMidnight, cycleStats, daysSinceLastCycle,
  topSymptoms, topMoods, symptomsByCycleDay,
  logsInRange, cyclesStartedInRange, logsInCycle,
  monthRange, yearRange, availableMonths, availableYears, perCycleSummary,
} from '../stats'
import { likelihoodByCycleDay } from '../prediction'
import { apiGet } from '../api'
import { useElementWidth } from '../useElementWidth'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// fallback widths used only until each chart's wrapper div is measured on mount
// (desktop values, matching the page's max-w-4xl layout, so desktop never flashes
// a different size): half-row card = (896 - 16 gap) / 2 = 440px; full-row card =
// 896px; both minus the card's p-6 padding (48px).
const CHART_WIDTH_FALLBACK = 384
const CHART_WIDTH_FULL_FALLBACK = 848

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { timeZone: 'UTC' })
}

// One logged day, rendered compactly: text lines instead of a pile of pills.
function DayDetail({ log, cycleStart }) {
  const dayNumber = cycleStart != null
    ? Math.floor((utcMidnight(log.date) - cycleStart) / MS_PER_DAY) + 1
    : null

  const symptomText = log.entries?.map(e => {
    const details = e.details && Object.entries(e.details)
      .filter(([, v]) => v && (!Array.isArray(v) || v.length))
      .map(([, v]) => (Array.isArray(v) ? v.join(', ') : v))
      .join(', ')
    return `${symptomByKey[e.key]?.label ?? e.key}${e.severity ? ` (${e.severity}` : ''}${e.severity && details ? `, ${details})` : e.severity ? ')' : details ? ` (${details})` : ''}`
  })

  return (
    <div className="border-t border-gray-100 py-3 first:border-t-0">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-medium text-[#13293E]">
          {dayNumber != null && <span className="text-gray-400 mr-1.5">Day {dayNumber}</span>}
          {new Date(log.date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        {log.flow && (
          <span className="text-xs bg-[#F4E1EB] text-[#13293E] px-2 py-0.5 rounded-full capitalize">{log.flow}</span>
        )}
      </div>

      {log.moods?.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-600">
          {log.moods.map(name => (
            <span key={name} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: moodEmotionByName[name]?.color ?? '#B8B8B8' }} />
              {name}
            </span>
          ))}
        </div>
      )}

      {symptomText?.length > 0 && (
        <p className="text-xs text-gray-500 mt-0.5">{symptomText.join(' · ')}</p>
      )}

      {log.notes && <p className="text-xs text-gray-400 italic mt-0.5">{log.notes}</p>}
    </div>
  )
}

// A clickable cycle bar that expands to show the logged days inside it.
function CycleBar({ title, subtitle, logs, cycleStart, expanded, onToggle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-[#F4E1EB]/40 transition-colors"
      >
        <div className="text-left">
          <p className="text-[#13293E] font-medium">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="px-6 pb-4">
            {logs.length ? (
              logs.map(log => <DayDetail key={log.id} log={log} cycleStart={cycleStart} />)
            ) : (
              <p className="text-sm text-gray-400 py-2">No days logged during this cycle</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function History() {
  const [cycles, setCycles] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [expandedIds, setExpandedIds] = useState(() => new Set())
  const [tab, setTab] = useState('stats')
  const [scope, setScope] = useState('all')
  const [scopeValue, setScopeValue] = useState(null)
  const [symptomChartRef, symptomChartWidth] = useElementWidth(CHART_WIDTH_FALLBACK)
  const [moodChartRef, moodChartWidth] = useElementWidth(CHART_WIDTH_FALLBACK)
  const [byDayChartRef, byDayChartWidth] = useElementWidth(CHART_WIDTH_FULL_FALLBACK)
  // the symptom/mood category labels shouldn't eat most of a narrow chart
  const symptomLabelWidth = Math.min(130, Math.max(70, symptomChartWidth * 0.35))
  const moodLabelWidth = Math.min(110, Math.max(60, moodChartWidth * 0.3))

  useEffect(() => {
    apiGet('/api/cycles').then(setCycles).catch(() => {})
  }, [])

  useEffect(() => {
    apiGet('/api/symptoms').then(setSymptoms).catch(() => {})
  }, [])

  function toggle(id) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const activeCycle = cycles.find(c => !c.endDate)
  const pastCycles = cycles
    .filter(c => c.endDate)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))

  function cycleLogsSorted(cycle) {
    return logsInCycle(symptoms, cycle).sort((a, b) => new Date(a.date) - new Date(b.date))
  }

  // logs that don't belong to any cycle (past or active)
  const orphanLogs = symptoms
    .filter(s => {
      const t = utcMidnight(s.date)
      return !cycles.some(c => {
        const start = utcMidnight(c.startDate)
        const end = c.endDate ? utcMidnight(c.endDate) : Infinity
        return t >= start && t <= end
      })
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  // ---- statistics scope: filtering = choosing which arrays the stat functions see ----
  const cyclesNewestFirst = [...cycles].sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
  const months = availableMonths(symptoms)
  const years = availableYears(symptoms)

  let filteredCycles = cycles
  let filteredSymptoms = symptoms
  let selectedCycle = null
  if (scope === 'cycle' && scopeValue != null) {
    selectedCycle = cycles.find(c => c.id === Number(scopeValue)) ?? null
    filteredCycles = selectedCycle ? [selectedCycle] : []
    filteredSymptoms = selectedCycle ? logsInCycle(symptoms, selectedCycle) : []
  } else if (scope === 'month' && scopeValue != null) {
    const [y, m] = String(scopeValue).split('-').map(Number)
    const [start, end] = monthRange(y, m)
    filteredCycles = cyclesStartedInRange(cycles, start, end)
    filteredSymptoms = logsInRange(symptoms, start, end)
  } else if (scope === 'year' && scopeValue != null) {
    const [start, end] = yearRange(Number(scopeValue))
    filteredCycles = cyclesStartedInRange(cycles, start, end)
    filteredSymptoms = logsInRange(symptoms, start, end)
  }

  function changeScope(next) {
    setScope(next)
    if (next === 'cycle') setScopeValue(cyclesNewestFirst[0]?.id ?? null)
    else if (next === 'month') setScopeValue(months[0] ? `${months[0].year}-${months[0].month}` : null)
    else if (next === 'year') setScopeValue(years[0] ?? null)
    else setScopeValue(null)
  }

  const stats = cycleStats(filteredCycles)
  const daysSince = daysSinceLastCycle(cycles)
  const perCycle = selectedCycle ? perCycleSummary(selectedCycle, symptoms) : null
  const symptomRanking = topSymptoms(filteredSymptoms).slice(0, 8)
  const moodRanking = topMoods(filteredSymptoms).slice(0, 8)
  const byCycleDay = symptomsByCycleDay(filteredCycles, filteredSymptoms)
  const likelihood = likelihoodByCycleDay(filteredCycles, filteredSymptoms)

  return (
    <div className="min-h-screen bg-[#FAF1F6] p-4 sm:p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">History</h1>

      <div className="w-full max-w-4xl flex flex-col gap-4">

        <div className="flex gap-2">
          <button
            onClick={() => setTab('stats')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'stats' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setTab('cycles')}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'cycles' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
            }`}
          >
            Past Cycles
          </button>
        </div>

        {tab === 'stats' && (<>

        <div className="flex gap-2">
          <select
            value={scope}
            onChange={(e) => changeScope(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-[#13293E]"
          >
            <option value="all">All time</option>
            <option value="cycle">By cycle</option>
            <option value="month">By month</option>
            <option value="year">By year</option>
          </select>

          {scope === 'cycle' && (
            <select
              value={scopeValue ?? ''}
              onChange={(e) => setScopeValue(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-[#13293E]"
            >
              {cyclesNewestFirst.map(c => (
                <option key={c.id} value={c.id}>
                  {c.endDate
                    ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}`
                    : `started ${formatDate(c.startDate)} · ongoing`}
                </option>
              ))}
            </select>
          )}

          {scope === 'month' && (
            <select
              value={scopeValue ?? ''}
              onChange={(e) => setScopeValue(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-[#13293E]"
            >
              {months.map(({ year, month }) => (
                <option key={`${year}-${month}`} value={`${year}-${month}`}>
                  {MONTH_NAMES[month]} {year}
                </option>
              ))}
            </select>
          )}

          {scope === 'year' && (
            <select
              value={scopeValue ?? ''}
              onChange={(e) => setScopeValue(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-[#13293E]"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            {scope === 'cycle' ? 'Flow Summary' : 'Flow Statistics'}
          </h2>
          {scope === 'cycle' ? (
            perCycle ? (
              <div className="grid grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{perCycle.lengthDays ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{perCycle.lengthDays != null ? 'days long' : 'ongoing'}</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{perCycle.daysLogged}</p>
                  <p className="text-xs text-gray-500 mt-0.5">days logged</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{perCycle.symptomCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">symptoms</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{perCycle.moodCount}</p>
                  <p className="text-xs text-gray-500 mt-0.5">moods</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No cycle selected</p>
            )
          ) : stats ? (
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-2xl font-semibold text-[#13293E]">{stats.avgLength}</p>
                <p className="text-xs text-gray-500 mt-0.5">avg days</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#13293E]">{stats.minLength}</p>
                <p className="text-xs text-gray-500 mt-0.5">shortest</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-[#13293E]">{stats.maxLength}</p>
                <p className="text-xs text-gray-500 mt-0.5">longest</p>
              </div>
              {scope === 'all' ? (
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{daysSince ?? '—'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{daysSince != null ? 'days since last' : 'cycle ongoing'}</p>
                </div>
              ) : (
                <div>
                  <p className="text-2xl font-semibold text-[#13293E]">{stats.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stats.count === 1 ? 'cycle' : 'cycles'}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No completed cycles in this range</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Most Common Symptoms</h2>
          {symptomRanking.length ? (
            <div ref={symptomChartRef} className="w-full">
              <BarChart width={symptomChartWidth} height={symptomRanking.length * 36 + 30} data={symptomRanking} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={symptomLabelWidth} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} ${v === 1 ? 'day' : 'days'}`, 'Logged']} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="count" fill="#4A88C9" radius={[0, 4, 4, 0]} barSize={14} />
              </BarChart>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No symptoms logged yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Most Common Moods</h2>
          {moodRanking.length ? (
            <div ref={moodChartRef} className="w-full">
              <BarChart width={moodChartWidth} height={moodRanking.length * 36 + 30} data={moodRanking} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke="#F3F4F6" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={moodLabelWidth} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [`${v} ${v === 1 ? 'day' : 'days'}`, 'Logged']} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                  {moodRanking.map(m => (
                    <Cell key={m.name} fill={m.color} />
                  ))}
                </Bar>
              </BarChart>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No moods logged yet</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm md:col-span-2">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Symptoms by Cycle Day</h2>
          {byCycleDay.data.length ? (
            <div ref={byDayChartRef} className="w-full">
              <BarChart width={byDayChartWidth} height={260} data={byCycleDay.data} margin={{ top: 0, right: 8, bottom: 0, left: -24 }}>
                <CartesianGrid vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="day" tickFormatter={(d) => `D${d}`} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip labelFormatter={(d) => `Cycle day ${d}`} cursor={{ fill: '#F3F4F6' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {byCycleDay.series.map(s => (
                  <Bar key={s.key} dataKey={s.key} name={s.label} stackId="day" fill={s.color} stroke="#ffffff" strokeWidth={1} barSize={26} />
                ))}
              </BarChart>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No symptoms logged inside a cycle yet</p>
          )}
        </div>

        {likelihood.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm md:col-span-2">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">What to Expect by Day</h2>
            <p className="text-xs text-gray-400 mb-3">
              How often each symptom and mood showed up on that cycle day ({likelihood[0]?.outOf ?? 0} past {likelihood[0]?.outOf === 1 ? 'cycle' : 'cycles'} in this range)
            </p>
            <div className="flex flex-col gap-2">
              {likelihood.map(({ day, symptoms: daySymptoms, moods: dayMoods }) => (
                <div key={day} className="flex gap-3 text-sm border-t border-gray-100 pt-2 first:border-t-0 first:pt-0">
                  <span className="text-gray-400 w-12 flex-shrink-0 font-medium">Day {day}</span>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {daySymptoms.map(s => (
                      <span key={s.key} className="text-[#13293E]">
                        {s.label} <span className="text-gray-400 text-xs">({s.seen}/{s.outOf})</span>
                      </span>
                    ))}
                    {dayMoods.map(m => (
                      <span key={m.name} className="flex items-center gap-1 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                        {m.name} <span className="text-gray-400 text-xs">({m.seen}/{m.outOf})</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        </div>
        </>)}

        {tab === 'cycles' && (<>

        {activeCycle && (
          <div className="bg-white/60 rounded-2xl shadow-sm px-4 sm:px-6 py-4 border border-dashed border-[#BCB6E2]">
            <p className="text-[#13293E] font-medium">
              {formatDate(activeCycle.startDate)} — not ended yet
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Current cycle · manage it in Log Entry</p>
          </div>
        )}

        {pastCycles.map(cycle => {
          const start = utcMidnight(cycle.startDate)
          const end = utcMidnight(cycle.endDate)
          const lengthDays = Math.floor((end - start) / MS_PER_DAY) + 1
          const logs = cycleLogsSorted(cycle)
          return (
            <CycleBar
              key={cycle.id}
              title={`${formatDate(cycle.startDate)} – ${formatDate(cycle.endDate)}`}
              subtitle={`${lengthDays} days · ${logs.length} ${logs.length === 1 ? 'day' : 'days'} logged`}
              logs={logs}
              cycleStart={start}
              expanded={expandedIds.has(cycle.id)}
              onToggle={() => toggle(cycle.id)}
            />
          )
        })}

        {orphanLogs.length > 0 && (
          <CycleBar
            title="Outside cycles"
            subtitle={`${orphanLogs.length} ${orphanLogs.length === 1 ? 'day' : 'days'} logged outside any cycle`}
            logs={orphanLogs}
            cycleStart={null}
            expanded={expandedIds.has('orphans')}
            onToggle={() => toggle('orphans')}
          />
        )}

        {!activeCycle && pastCycles.length === 0 && orphanLogs.length === 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm text-gray-400 text-center">
            No cycles or entries logged yet
          </div>
        )}

        </>)}

      </div>
    </div>
  )
}

export default History
