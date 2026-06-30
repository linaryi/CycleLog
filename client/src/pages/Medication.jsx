import { useState, useEffect } from 'react'

function Medication() {
  const [medications, setMedications] = useState([])
  const [name, setName] = useState('')
  const [doseMg, setDoseMg] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch('http://localhost:3000/api/medications')
      .then(res => res.json())
      .then(data => setMedications(data))
  }, [])

  async function handleSubmit() {
    const response = await fetch('http://localhost:3000/api/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 1,
        name,
        doseMg: Number(doseMg),
        takenAt: new Date().toLocaleDateString('en-CA'),
        notes,
      })
    })
    const data = await response.json()
    setMedications([...medications, data])
  }

  return (
    <div>
      <h1>Medication Log</h1>

      <label>Medication name: </label>
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} />

      <label>Dose (mg): </label>
      <input type="number" value={doseMg} onChange={(e) => setDoseMg(e.target.value)} />

      <label>Notes: </label>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />

      <button onClick={handleSubmit}>Log Medication</button>

      <h2>History</h2>
      {medications.map(entry => (
      <div key={entry.id}>
        <p>{entry.name} — {entry.doseMg}mg</p>
        <p>Taken: {new Date(entry.takenAt).toLocaleDateString()}</p>
        <p>{entry.notes}</p>
        <hr />
      </div>
      ))}
    </div>
  )
}

export default Medication