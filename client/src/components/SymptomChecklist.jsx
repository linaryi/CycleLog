import { symptomCatalog } from '../symptomCatalog'

const SEVERITIES = ['low', 'mid', 'high']

// value: array of { key, severity, details }
function SymptomChecklist({ value, onChange }) {
  function getEntry(key) {
    return value.find(e => e.key === key)
  }

  function toggleSymptom(key, checked) {
    if (checked) {
      onChange([...value, { key, severity: null, details: {} }])
    } else {
      onChange(value.filter(e => e.key !== key))
    }
  }

  function setSeverity(key, severity) {
    onChange(value.map(e => e.key === key ? { ...e, severity } : e))
  }

  function toggleFieldChoice(key, fieldName, choice, type) {
    onChange(value.map(e => {
      if (e.key !== key) return e
      const details = { ...e.details }
      if (type === 'multi') {
        const current = details[fieldName] || []
        details[fieldName] = current.includes(choice)
          ? current.filter(c => c !== choice)
          : [...current, choice]
      } else {
        details[fieldName] = details[fieldName] === choice ? null : choice
      }
      return { ...e, details }
    }))
  }

  return (
    <div className="flex flex-col gap-5">
      {symptomCatalog.map(({ group, symptoms }) => (
        <div key={group}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{group}</h4>
          <div className="flex flex-col gap-2">
            {symptoms.map(symptom => {
              const entry = getEntry(symptom.key)
              const checked = !!entry
              return (
                <div key={symptom.key} className={`rounded-lg border ${checked ? 'border-[#77D4F9] bg-[#F4E1EB]/40' : 'border-gray-200'} px-3 py-2`}>
                  <label className="flex items-center gap-2 text-sm text-[#13293E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => toggleSymptom(symptom.key, e.target.checked)}
                    />
                    {symptom.label}
                  </label>

                  {checked && (
                    <div className="mt-2 flex flex-col gap-2 pl-6">
                      {symptom.severity && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">Severity</span>
                          <div className="flex flex-wrap gap-1">
                            {SEVERITIES.map(sev => (
                              <button
                                type="button"
                                key={sev}
                                onClick={() => setSeverity(symptom.key, sev)}
                                className={`px-2.5 py-1 rounded-full text-xs capitalize transition-colors ${
                                  entry.severity === sev
                                    ? 'bg-[#13293E] text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-[#72B7E9]'
                                }`}
                              >
                                {sev}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {symptom.fields.map(field => (
                        <div key={field.name} className="flex flex-col gap-1">
                          <span className="text-xs text-gray-500">{field.label}</span>
                          <div className="flex flex-wrap gap-1">
                            {field.choices.map(choice => {
                              const details = entry.details || {}
                              const selected = field.type === 'multi'
                                ? (details[field.name] || []).includes(choice)
                                : details[field.name] === choice
                              return (
                                <button
                                  type="button"
                                  key={choice}
                                  onClick={() => toggleFieldChoice(symptom.key, field.name, choice, field.type)}
                                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                                    selected
                                      ? 'bg-[#72B7E9] text-white'
                                      : 'bg-white text-gray-500 border border-gray-200 hover:border-[#72B7E9]'
                                  }`}
                                >
                                  {choice}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SymptomChecklist
