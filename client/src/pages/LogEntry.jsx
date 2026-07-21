import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import SymptomChecklist from '../components/SymptomChecklist'
import MoodPicker from '../components/MoodPicker'
import Toast from '../components/Toast'
import DaySummary from '../components/DaySummary'
import { apiGet, apiPost, apiPut } from '../api'

function LogEntry() {
  const [searchParams] = useSearchParams()
  const [cycles, setCycles] = useState([])
  const [cycleEndDate, setCycleEndDate] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [symptomDate, setSymptomDate] = useState(
    // allow Calendar to link here with a specific day pre-selected (/log?date=2026-07-11)
    searchParams.get('date') ?? new Date().toLocaleDateString('en-CA')
  )
  const [symptoms, setSymptoms] = useState([])
  const [flow, setFlow] = useState('')
  const [moods, setMoods] = useState([])
  const [notes, setNotes] = useState('')
  const [entries, setEntries] = useState([])
  const [justSaved, setJustSaved] = useState(false)
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef(null)

  const activeCycles = cycles.filter(c => !c.endDate)
  const savedLog = symptoms.find(
    s => new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'UTC' }) === symptomDate
  )

  function showToast(message) {
    clearTimeout(toastTimer.current)
    setToast({ show: true, message })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2000)
  }

  useEffect(() => {
    apiGet('/api/cycles').then(setCycles).catch(() => {})
  }, [])

  useEffect(() => {
    apiGet('/api/symptoms').then(setSymptoms).catch(() => {})
  }, [])

  useEffect(() => {
    const existing = symptoms.find(
      s => new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'UTC' }) === symptomDate
    )
    setFlow(existing?.flow ?? '')
    setMoods(existing?.moods ?? [])
    setNotes(existing?.notes ?? '')
    setEntries(existing?.entries?.map(e => ({ key: e.key, severity: e.severity, details: e.details || {} })) ?? [])
  }, [symptomDate, symptoms])

  // picking a different day goes back to the editable form
  useEffect(() => {
    setJustSaved(false)
  }, [symptomDate])

  async function handleEndCycle(id) {
    const data = await apiPut(`/api/cycles/${id}`, { endDate: cycleEndDate })
    setCycles(cycles.map(c => c.id === id ? data : c))
  }

  async function handleSubmit() {
    try {
      const data = await apiPost('/api/symptoms', {
        date: symptomDate,
        flow,
        moods,
        notes,
        entries,
      })
      setSymptoms(prev => [...prev.filter(s => s.id !== data.log.id), data.log])
      setJustSaved(true)
      if (data.cycle) {
        setCycles(prev => [...prev.filter(c => c.id !== data.cycle.id), data.cycle])
        showToast(data.cycleStarted ? 'Saved — cycle started ✓' : 'Saved — cycle updated ✓')
      } else {
        showToast('Saved ✓')
      }
    } catch (err) {
      console.error('save failed:', err)
      showToast('Save failed — try again')
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF1F6] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Log Entry</h1>

      <div className="w-full max-w-xl flex flex-col gap-6">

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Current Cycle</h2>

          {activeCycles.length > 0 ? (
            <div className="flex flex-col gap-3">
              {activeCycles.map(cycle => (
                <div key={cycle.id} className="border border-gray-200 rounded-xl px-4 py-3">
                  <p className="text-[#13293E] text-sm font-medium">
                    Started {new Date(cycle.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}
                  </p>
                  <p className="text-gray-500 text-sm">
                    Ongoing — ends automatically after 3 days without flow, or end it manually:
                  </p>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="date"
                      value={selectedCycleId === cycle.id ? cycleEndDate : ''}
                      onChange={(e) => {
                        setSelectedCycleId(cycle.id)
                        setCycleEndDate(e.target.value)
                      }}
                      className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                    />
                    <button
                      onClick={() => handleEndCycle(cycle.id)}
                      className="bg-[#BCB6E2] text-[#13293E] px-3 py-1.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      End Cycle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              No active cycle — one starts automatically when you log flow below.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Daily Log</h2>

          {justSaved && savedLog ? (
            <div>
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-[#A8D8B9] flex items-center justify-center mb-2">
                  <svg className="w-6 h-6 text-[#13293E]" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[#13293E] font-medium">
                  Logged for {new Date(symptomDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>

              <DaySummary log={savedLog} />

              <button
                onClick={() => setJustSaved(false)}
                className="w-full mt-5 bg-[#F4E1EB] text-[#13293E] py-2.5 rounded-xl font-medium hover:bg-[#BCB6E2]/50 transition-colors"
              >
                Edit
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input type="date" value={symptomDate} onChange={(e) => setSymptomDate(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Flow</label>
                <select value={flow} onChange={(e) => setFlow(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm">
                  <option value="">None</option>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mood</h3>
              <div className="mb-4">
                <MoodPicker value={moods} onChange={setMoods} />
              </div>

              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Symptoms</h3>
              <div className="mb-4">
                <SymptomChecklist value={entries} onChange={setEntries} />
              </div>

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" rows={2} />
              </div>

              <button onClick={handleSubmit} className="w-full bg-[#13293E] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
                Save Entry
              </button>
            </>
          )}
        </div>

      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}

export default LogEntry
