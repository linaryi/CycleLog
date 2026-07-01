import { moodCatalog } from '../moodCatalog'

// value: { tier, specific }
function MoodPicker({ value, onChange }) {
  const selectedTier = value?.tier ?? null
  const selectedSpecific = value?.specific ?? null

  function selectTier(tier) {
    if (tier === selectedTier) {
      onChange({ tier: null, specific: null })
    } else {
      onChange({ tier, specific: null })
    }
  }

  function selectEmotion(tier, name) {
    onChange({ tier, specific: selectedSpecific === name ? null : name })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {moodCatalog.map(({ tier, label }) => (
          <button
            type="button"
            key={tier}
            onClick={() => selectTier(tier)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedTier === tier
                ? 'bg-[#13293E] text-white'
                : 'bg-[#F4E1EB] text-[#13293E] hover:bg-[#BCB6E2]/50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {moodCatalog.map(({ tier, emotions }) => (
        <div
          key={tier}
          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            selectedTier === tier ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
            <div className="flex flex-wrap gap-1.5 pt-2">
              {emotions.map(({ name, color, icon }) => {
                const selected = selectedSpecific === name
                return (
                  <button
                    type="button"
                    key={name}
                    onClick={() => selectEmotion(tier, name)}
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
