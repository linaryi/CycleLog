import { useState, useEffect } from 'react'

function LogEntry() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [cycles, setCycles] = useState([])
  const [cycleEndDate, setCycleEndDate] = useState('')
  const [selectedCycleId, setSelectedCycleId] = useState(null)
  const [symptomDate, setSymptomDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [symptoms, setSymptoms] = useState([])
  const [cramps, setCramps] = useState(0)
  const [fatigue, setFatigue] = useState(0)
  const [flow, setFlow] = useState('')
  const [mood, setMood] = useState('')
  const [headache, setHeadache] = useState(false)
  const [headacheSide, setHeadacheSide] = useState('')
  const [headacheSeverity, setHeadacheSeverity] = useState(0)
  const [bloating, setBloating] = useState(false)
  const [notes, setNotes] = useState('')

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
    setCramps(existing?.cramps ?? 0)
    setFatigue(existing?.fatigue ?? 0)
    setFlow(existing?.flow ?? '')
    setMood(existing?.mood ?? '')
    setHeadache(existing?.headache ?? false)
    setHeadacheSide(existing?.headacheSide ?? '')
    setHeadacheSeverity(existing?.headacheSeverity ?? 0)
    setBloating(existing?.bloating ?? false)
    setNotes(existing?.notes ?? '')
  }, [symptomDate, symptoms])

  async function handleEndCycle(id) {
    console.log('ending cycle', id, 'with date', cycleEndDate)
    const response = await fetch(`http://localhost:3000/api/cycles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endDate: cycleEndDate }),
    })
    const data = await response.json()
    setCycles(cycles.map(c => c.id === id ? data : c))
  }

  async function handleCycleSubmit() {
  const response = await fetch('http://localhost:3000/api/cycles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      startDate,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    })
  })
  const data = await response.json()
  console.log('cycle saved:', data)
  }

  async function handleSubmit() {
  const response = await fetch('http://localhost:3000/api/symptoms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      date: symptomDate,
      cramps,
      fatigue,
      flow,
      mood,
      headache,
      headacheSide,
      headacheSeverity,
      bloating,
      notes,
    })
  })
  const data = await response.json()
  console.log('saved:', data)
  setSymptoms(prev => [...prev.filter(s => s.id !== data.id), data])
  }
  
  return (
    <div>
      <h1>Log Entry</h1>

      <h2>Cycle</h2>
      <label>Start date: </label>
      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

      <label>End date: </label>
      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      <button onClick={handleCycleSubmit}>Log Cycle</button>

      <h2>Active Cycles</h2>
      {cycles.map(cycle => (
        <div key={cycle.id}>
          <p>Started: {new Date(cycle.startDate).toLocaleDateString('en-US', { timeZone: 'UTC' })}</p>
          <p>Ended: {cycle.endDate ? new Date(cycle.endDate).toLocaleDateString('en-US', { timeZone: 'UTC' }) : 'ongoing'}</p>
          {!cycle.endDate && (
            <>
              <input
                type="date"
                value={selectedCycleId === cycle.id ? cycleEndDate : ''}
                onChange={(e) => {
                  setSelectedCycleId(cycle.id)
                  setCycleEndDate(e.target.value)
                }}
              />
              <button onClick={() => handleEndCycle(cycle.id)}>End Cycle</button>
            </>
          )}
          <hr />
        </div>
      ))}
      <h2>Symptoms</h2>

      <label>Date: </label>
      <input type="date" value={symptomDate} onChange={(e) => setSymptomDate(e.target.value)} />

      <label>Flow: </label>
      <select value={flow} onChange={(e) => setFlow(e.target.value)}>
        <option value="">None</option>
        <option value="light">Light</option>
        <option value="medium">Medium</option>
        <option value="heavy">Heavy</option>
      </select>

      <label>Cramps (0-5): </label>
      <input type="number" value={cramps} onChange={(e) => setCramps(Number(e.target.value))} />

      <label>Fatigue (0-5): </label>
      <input type="number" value={fatigue} onChange={(e) => setFatigue(Number(e.target.value))} />

      <label>Mood: </label>
      <input type="text" value={mood} onChange={(e) => setMood(e.target.value)} />

      <label>Headache: </label>
      <input type="checkbox" checked={headache} onChange={(e) => setHeadache(e.target.checked)} />

      {headache && (
        <>
          <label>Side: </label>
          <select value={headacheSide} onChange={(e) => setHeadacheSide(e.target.value)}>
            <option value="">Select</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="both">Both</option>
          </select>

          <label>Severity (0-5): </label>
          <input type="number" value={headacheSeverity} onChange={(e) => setHeadacheSeverity(Number(e.target.value))} />
        </>
      )}

      <label>Bloating: </label>
      <input type="checkbox" checked={bloating} onChange={(e) => setBloating(e.target.checked)} />

      <label>Notes: </label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button onClick={handleSubmit}>Save Entry</button>
    </div>
  )
}

export default LogEntry