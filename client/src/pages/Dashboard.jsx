import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

function Dashboard() {
  const [cycles, setCycles] = useState([])
  const [symptoms, setSymptoms] = useState([])

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

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 w-full max-w-xl">

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
              <p className="text-gray-500 text-sm mt-1">Cramps: {lastSymptom.cramps ?? '—'} · Fatigue: {lastSymptom.fatigue ?? '—'} · Mood: {lastSymptom.mood || '—'}</p>
            </div>
          ) : (
            <p className="text-gray-400">No symptoms logged yet</p>
          )}
        </div>

        <div className="flex gap-4">
          <Link to="/log" className="flex-1 bg-[#13293E] text-white text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Log Entry</Link>
          <Link to="/medication" className="flex-1 bg-[#BCB6E2] text-[#13293E] text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Medication</Link>
          <Link to="/calendar" className="flex-1 bg-[#77D4F9] text-[#13293E] text-center py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">Calendar</Link>
        </div>

      </div>
    </div>
  )
}

export default Dashboard