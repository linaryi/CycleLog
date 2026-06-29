import { useState } from 'react'

function LogEntry() {
  const [cramps, setCramps] = useState(0)
  const [fatigue, setFatigue] = useState(0)
  const [mood, setMood] = useState('')
  const [headache, setHeadache] = useState(false)
  const [headacheSide, setHeadacheSide] = useState('')
  const [headacheSeverity, setHeadacheSeverity] = useState(0)
  const [bloating, setBloating] = useState(false)
  const [notes, setNotes] = useState('')

  async function handleSubmit() {
  const response = await fetch('http://localhost:3000/api/symptoms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 1,
      date: new Date().toISOString(),
      cramps,
      fatigue,
      mood,
      headache,
      bloating,
      notes,
    })
  })
  const data = await response.json()
  console.log('saved:', data)
  }
  
  return (
    <div>
      <h1>Log Entry</h1>

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