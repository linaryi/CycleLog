import { useState, useEffect } from 'react'

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
          <p>Cramps: {entry.cramps}</p>
          <p>Fatigue: {entry.fatigue}</p>
          <p>Mood: {entry.mood}</p>
          <hr />
        </div>
      ))}
    </div>
  )
}

export default History