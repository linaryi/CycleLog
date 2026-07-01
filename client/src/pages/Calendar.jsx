import { useState, useEffect } from 'react'
import ReactCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { moodEmotionByName } from '../moodCatalog'

const NEUTRAL_MOOD_COLOR = '#B8B8B8'

function dateKey(date, utc) {
  return utc
    ? `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function Calendar() {
  const [symptoms, setSymptoms] = useState([])
  const [view, setView] = useState('cycle')

  useEffect(() => {
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
  }, [])

  const loggedDates = symptoms.map(entry => dateKey(new Date(entry.date), true))

  const moodByDate = Object.fromEntries(
    symptoms
      .filter(entry => entry.moodTier)
      .map(entry => [
        dateKey(new Date(entry.date), true),
        entry.moodSpecific
          ? moodEmotionByName[entry.moodSpecific]?.color ?? NEUTRAL_MOOD_COLOR
          : NEUTRAL_MOOD_COLOR,
      ])
  )

  function tileClassName({ date }) {
    if (view !== 'cycle') return
    if (loggedDates.includes(dateKey(date))) {
      return 'logged-day'
    }
  }

  function tileContent({ date }) {
    if (view !== 'mood') return null
    const color = moodByDate[dateKey(date)]
    if (!color) return null
    return (
      <div className="flex justify-center mt-1">
        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Calendar</h1>

      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setView('cycle')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                view === 'cycle' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
              }`}
            >
              Cycle Log
            </button>
            <button
              onClick={() => setView('mood')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                view === 'mood' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
              }`}
            >
              Mood
            </button>
          </div>

          <ReactCalendar tileClassName={tileClassName} tileContent={tileContent} className="cyclelog-calendar" />
        </div>
      </div>
    </div>
  )
}

export default Calendar
