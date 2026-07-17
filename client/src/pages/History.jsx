import { useState, useEffect } from 'react'
import { symptomByKey } from '../symptomCatalog'
import { moodEmotionByName } from '../moodCatalog'

const MS_PER_DAY = 1000 * 60 * 60 * 24

function utcMidnight(dateStr) {
  const d = new Date(dateStr)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

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
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F4E1EB]/40 transition-colors"
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

  useEffect(() => {
    fetch('http://localhost:3000/api/cycles')
      .then(res => res.json())
      .then(data => setCycles(data))
  }, [])

  useEffect(() => {
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
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

  function logsWithin(start, end) {
    return symptoms
      .filter(s => {
        const t = utcMidnight(s.date)
        return t >= start && t <= end
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
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

  return (
    <div className="min-h-screen bg-[#FAF1F6] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">History</h1>

      <div className="w-full max-w-xl flex flex-col gap-4">

        {activeCycle && (
          <div className="bg-white/60 rounded-2xl shadow-sm px-6 py-4 border border-dashed border-[#BCB6E2]">
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
          const logs = logsWithin(start, end)
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
          <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400 text-center">
            No cycles or entries logged yet
          </div>
        )}

      </div>
    </div>
  )
}

export default History
