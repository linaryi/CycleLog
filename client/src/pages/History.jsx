import { useState, useEffect } from 'react'
import { symptomByKey } from '../symptomCatalog'
import { moodTierByKey, moodEmotionByName } from '../moodCatalog'

function History() {
  const [symptoms, setSymptoms] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
  }, [])

  const sorted = [...symptoms].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="min-h-screen bg-[#F4E1EB] p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">History</h1>

      <div className="w-full max-w-xl flex flex-col gap-4">
        {sorted.length === 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-gray-400 text-center">
            No entries logged yet
          </div>
        )}

        {sorted.map(entry => {
          const moodLabel = entry.moodSpecific || (entry.moodTier ? moodTierByKey[entry.moodTier]?.label : null)
          const moodColor = entry.moodSpecific ? moodEmotionByName[entry.moodSpecific]?.color : null
          return (
            <div key={entry.id} className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[#13293E] font-medium">
                  {new Date(entry.date).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {entry.flow && (
                  <span className="text-xs bg-[#F4E1EB] text-[#13293E] px-2.5 py-1 rounded-full capitalize">{entry.flow} flow</span>
                )}
              </div>

              {moodLabel && (
                <div className="flex items-center gap-1.5 mb-2">
                  {moodColor && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: moodColor }} />}
                  <span className="text-sm text-gray-600">Mood: {moodLabel}</span>
                </div>
              )}

              {entry.entries?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {entry.entries.map(e => {
                    const catalogSymptom = symptomByKey[e.key]
                    const details = e.details && Object.entries(e.details)
                      .filter(([, v]) => v && (!Array.isArray(v) || v.length))
                      .map(([, v]) => (Array.isArray(v) ? v.join(', ') : v))
                      .join(', ')
                    return (
                      <span key={e.id} className="text-xs bg-[#F4E1EB] text-[#13293E] px-2.5 py-1 rounded-full">
                        {catalogSymptom?.label ?? e.key}
                        {e.severity ? ` · ${e.severity}` : ''}
                        {details ? ` (${details})` : ''}
                      </span>
                    )
                  })}
                </div>
              )}

              {entry.notes && (
                <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default History
