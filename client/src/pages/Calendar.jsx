import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { moodCatalog, moodEmotionByName } from '../moodCatalog'
import DaySummary from '../components/DaySummary'
import { apiGet } from '../api'

const NEUTRAL_MOOD_COLOR = '#B8B8B8'

function dateKey(date, utc) {
  return utc
    ? `${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`
    : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// color -> emotion names that share it, e.g. '#E4767C' -> ['Anxious', 'Angry', ...]
// Derived from the catalog so the legend stays correct when emotions are added.
const legendGroups = moodCatalog
  .flatMap(t => t.emotions)
  .reduce((groups, { name, color }) => {
    (groups[color] ??= []).push(name)
    return groups
  }, {})

function Calendar() {
  const [symptoms, setSymptoms] = useState([])
  const [view, setView] = useState('cycle')
  const [selectedDay, setSelectedDay] = useState(null)

  useEffect(() => {
    apiGet('/api/symptoms').then(setSymptoms).catch(() => {})
  }, [])

  const loggedDates = symptoms.map(entry => dateKey(new Date(entry.date), true))

  const moodColorsByDate = Object.fromEntries(
    symptoms
      .filter(entry => entry.moods?.length)
      .map(entry => [
        dateKey(new Date(entry.date), true),
        // dedupe: one dot per distinct color, capped so tiles stay readable
        [...new Set(entry.moods.map(name => moodEmotionByName[name]?.color ?? NEUTRAL_MOOD_COLOR))].slice(0, 4),
      ])
  )

  const selectedLog = selectedDay
    ? symptoms.find(s => dateKey(new Date(s.date), true) === dateKey(selectedDay))
    : null
  const selectedDateStr = selectedDay?.toLocaleDateString('en-CA')

  function handleDayClick(date) {
    // clicking the already-open day closes the panel
    setSelectedDay(prev => (prev && dateKey(prev) === dateKey(date) ? null : date))
  }

  // Every tile gets a dot row — invisible when there's nothing logged — so day
  // numbers sit at the same height whether or not the day has data.
  function tileContent({ date }) {
    if (view === 'cycle') {
      const logged = loggedDates.includes(dateKey(date))
      return (
        <div className="flex justify-center mt-2">
          <span className={`w-2 h-2 rounded-full inline-block bg-gray-400 ${logged ? '' : 'invisible'}`} />
        </div>
      )
    }

    const colors = moodColorsByDate[dateKey(date)]
    if (!colors?.length) {
      return (
        <div className="flex justify-center mt-2">
          <span className="w-2 h-2 rounded-full inline-block invisible" />
        </div>
      )
    }
    return (
      <div className="flex justify-center gap-0.5 mt-2">
        {colors.map(color => (
          <span key={color} className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF1F6] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Calendar</h1>

      <div className={`flex items-start transition-[gap] duration-500 ease-in-out ${selectedDay ? 'gap-6' : 'gap-0'}`}>

        <div className="w-[42rem] flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col gap-2 mb-4">
            <button
              onClick={() => setView('cycle')}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                view === 'cycle' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
              }`}
            >
              Cycle Log
            </button>
            <button
              onClick={() => setView('mood')}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                view === 'mood' ? 'bg-[#13293E] text-white' : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
              }`}
            >
              Mood
            </button>
          </div>

          <ReactCalendar
            tileContent={tileContent}
            onClickDay={handleDayClick}
            className="cyclelog-calendar"
          />

          {view === 'mood' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Mood Colors</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {Object.entries(legendGroups).map(([color, names]) => (
                  <div key={color} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs text-gray-600">{names.join(', ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedDay ? 'w-[22rem] opacity-100' : 'w-0 opacity-0'}`}>
          <div className="w-[22rem] bg-white rounded-2xl p-6 shadow-sm">
            {selectedDay && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h2>
                  <button onClick={() => setSelectedDay(null)} className="text-gray-400 hover:text-[#13293E] transition-colors" aria-label="Close">
                    ✕
                  </button>
                </div>

                {selectedLog ? (
                  <DaySummary log={selectedLog} />
                ) : (
                  <p className="text-gray-400 text-sm mb-2">Nothing logged for this day</p>
                )}

                <Link
                  to={`/log?date=${selectedDateStr}`}
                  className="block w-full mt-4 bg-[#13293E] text-white text-center py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  {selectedLog ? 'Edit in Log Entry' : 'Log this day'}
                </Link>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Calendar
