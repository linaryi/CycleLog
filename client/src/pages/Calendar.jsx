import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ReactCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { moodCatalog, moodEmotionByName } from '../moodCatalog'
import { symptomByKey } from '../symptomCatalog'

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
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
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

  function tileClassName({ date }) {
    if (view !== 'cycle') return
    if (loggedDates.includes(dateKey(date))) {
      return 'logged-day'
    }
  }

  function tileContent({ date }) {
    if (view !== 'mood') return null
    const colors = moodColorsByDate[dateKey(date)]
    if (!colors?.length) return null
    return (
      <div className="flex justify-center gap-0.5 mt-1">
        {colors.map(color => (
          <span key={color} className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Calendar</h1>

      <div className={`flex items-start transition-[gap] duration-500 ease-in-out ${selectedDay ? 'gap-6' : 'gap-0'}`}>

        <div className="w-[42rem] flex-shrink-0 bg-white rounded-2xl p-6 shadow-sm">
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

          <ReactCalendar
            tileClassName={tileClassName}
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
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Flow</h3>
                      <p className="text-sm text-[#13293E] capitalize">{selectedLog.flow || 'None'}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mood</h3>
                      {selectedLog.moods?.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLog.moods.map(name => (
                            <span key={name} className="flex items-center gap-1.5 text-xs bg-[#F4E1EB] text-[#13293E] px-2.5 py-1 rounded-full">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: moodEmotionByName[name]?.color ?? NEUTRAL_MOOD_COLOR }} />
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">Not logged</p>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Symptoms</h3>
                      {selectedLog.entries?.length ? (
                        <div className="flex flex-col gap-1">
                          {selectedLog.entries.map(e => {
                            const details = e.details && Object.entries(e.details)
                              .filter(([, v]) => v && (!Array.isArray(v) || v.length))
                              .map(([, v]) => (Array.isArray(v) ? v.join(', ') : v))
                              .join(', ')
                            return (
                              <p key={e.id} className="text-sm text-[#13293E]">
                                {symptomByKey[e.key]?.label ?? e.key}
                                {e.severity && <span className="text-gray-500"> · {e.severity}</span>}
                                {details && <span className="text-gray-500"> ({details})</span>}
                              </p>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">None</p>
                      )}
                    </div>

                    {selectedLog.notes && (
                      <div>
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</h3>
                        <p className="text-sm text-gray-600">{selectedLog.notes}</p>
                      </div>
                    )}
                  </div>
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
