import { useState } from 'react'
import { moodCatalog } from '../moodCatalog'

// value: array of selected emotion names, e.g. ['Stressed', 'Lazy']
// Emotions can be selected across tiers at the same time (feeling stressed AND lazy is valid).
function MoodPicker({ value, onChange }) {
  const [openTiers, setOpenTiers] = useState(() => new Set())

  function toggleTierOpen(tier) {
    setOpenTiers(prev => {
      const next = new Set(prev)
      if (next.has(tier)) next.delete(tier)
      else next.add(tier)
      return next
    })
  }

  function toggleEmotion(name) {
    onChange(value.includes(name) ? value.filter(n => n !== name) : [...value, name])
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {moodCatalog.map(({ tier, label, emotions }) => {
          const selectedCount = emotions.filter(e => value.includes(e.name)).length
          return (
            <button
              type="button"
              key={tier}
              onClick={() => toggleTierOpen(tier)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors relative ${
                openTiers.has(tier)
                  ? 'bg-[#13293E] text-white'
                  : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
              }`}
            >
              {label}
              {selectedCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-white/25 text-[10px]">
                  {selectedCount}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {moodCatalog.map(({ tier, emotions }) => (
        <div
          key={tier}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            openTiers.has(tier) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {emotions.map(({ name, color, icon }) => {
                const selected = value.includes(name)
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => toggleEmotion(name)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-colors border ${
                      selected ? 'border-[#13293E] bg-[#13293E] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {icon ? (
                      <img src={icon} alt="" className="w-4 h-4 object-contain" />
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    )}
                    {name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MoodPicker
