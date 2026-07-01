import { useState, useEffect } from 'react'
import { symptomByKey } from '../symptomCatalog'

function History() {
  const [symptoms, setSymptoms] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
  }, [])

  return (
    <div>
      <h1>History</h1>
      {symptoms.map(entry => (
        <div key={entry.id}>
          <p>Date: {entry.date}</p>
          <p>Flow: {entry.flow || '—'}</p>
          <p>Mood: {entry.mood || '—'}</p>
          <p>Notes: {entry.notes || '—'}</p>
          {entry.entries?.map(e => {
            const catalogSymptom = symptomByKey[e.key]
            const details = e.details && Object.entries(e.details)
              .filter(([, v]) => v && (!Array.isArray(v) || v.length))
              .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
              .join(' · ')
            return (
              <p key={e.id}>
                {catalogSymptom?.label ?? e.key}
                {e.severity ? ` (${e.severity})` : ''}
                {details ? ` — ${details}` : ''}
              </p>
            )
          })}
          <hr />
        </div>
      ))}
    </div>
  )
}

export default History
