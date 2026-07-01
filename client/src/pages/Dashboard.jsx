import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SymptomChecklist from '../components/SymptomChecklist'
import MoodPicker from '../components/MoodPicker'
import { symptomByKey } from '../symptomCatalog'
import { moodTierByKey } from '../moodCatalog'

function toDateKey(date) {
  return date.toLocaleDateString('en-CA')
}

function Dashboard() {
  const [cycles, setCycles] = useState([])
  const [symptoms, setSymptoms] = useState([])
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))

  const [flow, setFlow] = useState('')
  const [moodTier, setMoodTier] = useState(null)
  const [moodSpecific, setMoodSpecific] = useState(null)
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false)

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

  const activeCycle = cycles.find(c => !c.endDate)
  const cycleDay = activeCycle
    ? Math.floor((new Date() - new Date(activeCycle.startDate)) / (1000 * 60 * 60 * 24)) + 1
    : null

  const lastSymptom = symptoms.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  const lastSymptomLabels = lastSymptom?.entries?.map(e => symptomByKey[e.key]?.label ?? e.key) ?? []
  const lastMoodLabel = lastSymptom?.moodSpecific ?? (lastSymptom?.moodTier ? moodTierByKey[lastSymptom.moodTier]?.label : null) ?? '—'

  const today = new Date()
  const days = [-2, -1, 0, 1, 2].map(offset => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    return d
  })

  function symptomFor(dateKey) {
    return symptoms.find(
      s => new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'UTC' }) === dateKey
    )
  }

  useEffect(() => {
    const existing = symptomFor(selectedDate)
    setFlow(existing?.flow ?? '')
    setMoodTier(existing?.moodTier ?? null)
    setMoodSpecific(existing?.moodSpecific ?? null)
    setNotes(existing?.notes ?? '')
    setEntries(existing?.entries?.map(e => ({ key: e.key, severity: e.severity, details: e.details || {} })) ?? [])
  }, [selectedDate, symptoms])

  async function handleSave() {
    const response = await fetch('http://localhost:3000/api/symptoms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        date: selectedDate,
        flow,
        moodTier,
        moodSpecific,
        notes,
        entries,
      })
    })
    const data = await response.json()
    setSymptoms(prev => [...prev.filter(s => s.id !== data.id), data])
  }

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Dashboard</h1>

      <div className={`flex items-start transition-[gap] duration-500 ease-in-out ${isQuickLogOpen ? 'gap-6' : 'gap-0'}`}>

          <div className="w-[36rem] flex-shrink-0 flex flex-col gap-6">

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Current Cycle</h2>
              {activeCycle ? (
                <p className="text-2xl font-semibold text-[#13293E]">Day {cycleDay}</p>
              ) : (
                <p className="text-gray-400">Not currently tracking</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Last Logged</h2>
              {lastSymptom ? (
                <div>
                  <p className="text-[#13293E] font-medium">{new Date(lastSymptom.date).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {lastSymptomLabels.length ? lastSymptomLabels.join(' · ') : 'No symptoms'} · Mood: {lastMoodLabel}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">No symptoms logged yet</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">This Week</h2>

              <div className="flex justify-between gap-2 mb-4">
                {days.map(d => {
                  const dateKey = toDateKey(d)
                  const isSelected = dateKey === selectedDate
                  const isToday = dateKey === toDateKey(today)
                  const hasLog = !!symptomFor(dateKey)
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(dateKey)}
                      className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-colors ${
                        isSelected ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
                      }`}
                    >
                      <span className="text-xs uppercase tracking-wide opacity-70">
                        {d.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-semibold">{d.getDate()}</span>
                      {isToday && <span className="text-[10px] opacity-70">Today</span>}
                      <span className={`mt-1 w-1.5 h-1.5 rounded-full ${hasLog ? (isSelected ? 'bg-white' : 'bg-[#72B7E9]') : 'bg-transparent'}`} />
                    </button>
                  )
                })}
              </div>

              <button
                onClick={() => setIsQuickLogOpen(open => !open)}
                className="w-full flex items-center justify-between bg-[#F4E1EB] text-[#13293E] px-4 py-2.5 rounded-xl font-medium hover:bg-[#BCB6E2]/50 transition-colors"
              >
                <span>
                  Quick Log — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform duration-300 ${isQuickLogOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20" fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.06a.75.75 0 111.08 1.04l-4.25 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            <div className="flex gap-4">
              <Link to="/log" className="flex-1 bg-[#13293E] text-white text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Log Entry</Link>
              <Link to="/medication" className="flex-1 bg-[#BCB6E2] text-[#13293E] text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Medication</Link>
              <Link to="/calendar" className="flex-1 bg-[#77D4F9] text-[#13293E] text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Calendar</Link>
            </div>

          </div>

          <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isQuickLogOpen ? 'w-[28rem] opacity-100' : 'w-0 opacity-0'}`}>
            <div className="w-[28rem] bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                Quick Log — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </h2>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Flow</label>
                <select value={flow} onChange={(e) => setFlow(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">None</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mood</h4>
              <div className="mb-4">
                <MoodPicker value={{ tier: moodTier, specific: moodSpecific }} onChange={(v) => { setMoodTier(v.tier); setMoodSpecific(v.specific) }} />
              </div>

              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Symptoms</h4>
              <div className="mb-4 max-h-80 overflow-y-auto pr-1">
                <SymptomChecklist value={entries} onChange={setEntries} />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" rows={2} />
              </div>

              <button onClick={handleSave} className="w-full bg-[#13293E] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
                Save
              </button>
            </div>
          </div>

      </div>
    </div>
  )
}

export default Dashboard
