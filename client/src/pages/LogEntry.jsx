import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import SymptomChecklist from '../components/SymptomChecklist'
import MoodPicker from '../components/MoodPicker'
import Toast from '../components/Toast'

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
  const [toast, setToast] = useState({ show: false, message: '' })
  const toastTimer = useRef(null)

  const activeCycles = cycles.filter(c => !c.endDate)

  function showToast(message) {
    clearTimeout(toastTimer.current)
    setToast({ show: true, message })
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2000)
  }

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

  useEffect(() => {
    const existing = symptoms.find(
      s => new Date(s.date).toLocaleDateString('en-CA', { timeZone: 'UTC' }) === symptomDate
    )
    setFlow(existing?.flow ?? '')
    setMoods(existing?.moods ?? [])
    setNotes(existing?.notes ?? '')
    setEntries(existing?.entries?.map(e => ({ key: e.key, severity: e.severity, details: e.details || {} })) ?? [])
  }, [symptomDate, symptoms])

  async function handleEndCycle(id) {
    const response = await fetch(`http://localhost:3000/api/cycles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: cycleEndDate }),
    })
    const data = await response.json()
    setCycles(cycles.map(c => c.id === id ? data : c))
  }

  async function handleSubmit() {
    try {
      const response = await fetch('http://localhost:3000/api/symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 1,
          date: symptomDate,
          flow,
          moods,
          notes,
          entries,
        })
      })
      if (!response.ok) throw new Error(`Server responded ${response.status}`)
      const data = await response.json()
      setSymptoms(prev => [...prev.filter(s => s.id !== data.log.id), data.log])
      if (data.cycle) {
        setCycles(prev => [...prev, data.cycle])
        showToast('Saved — cycle started ✓')
      } else {
        showToast('Saved ✓')
      }
    } catch (err) {
      console.error('save failed:', err)
      showToast('Save failed — try again')
    }
  }

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
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
        </div>

      </div>

      <Toast show={toast.show} message={toast.message} />
    </div>
  )
}

export default LogEntry
