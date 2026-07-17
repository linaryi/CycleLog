import { moodEmotionByName } from '../moodCatalog'
import { symptomByKey } from '../symptomCatalog'

const NEUTRAL_MOOD_COLOR = '#B8B8B8'

// Read-only summary of one day's log (flow, moods, symptoms, notes).
// Shared by the Calendar side panel and Log Entry's post-save view.
function DaySummary({ log }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Flow</h3>
        <p className="text-sm text-[#13293E] capitalize">{log.flow || 'None'}</p>
      </div>

      <div>
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Mood</h3>
        {log.moods?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {log.moods.map(name => (
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
        {log.entries?.length ? (
          <div className="flex flex-col gap-1">
            {log.entries.map(e => {
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

      {log.notes && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</h3>
          <p className="text-sm text-gray-600">{log.notes}</p>
        </div>
      )}
    </div>
  )
}

export default DaySummary
