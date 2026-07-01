// Central definition of all trackable symptoms, grouped by body system.
// Add a new symptom here (no schema change needed) and it shows up everywhere.
export const symptomCatalog = [
  {
    group: 'Head & Pain',
    symptoms: [
      {
        key: 'headache',
        label: 'Headache / Migraine',
        severity: true,
        fields: [
          { name: 'side', label: 'Side', type: 'multi', choices: ['Left', 'Right', 'Middle'] },
        ],
      },
      { key: 'lowerBackPain', label: 'Lower Back Pain', severity: true, fields: [] },
      { key: 'pelvicPain', label: 'Pelvic Pain', severity: true, fields: [] },
      {
        key: 'breastPain',
        label: 'Breast Pain',
        severity: true,
        fields: [
          { name: 'side', label: 'Side', type: 'multi', choices: ['Left', 'Right'] },
        ],
      },
      { key: 'cramps', label: 'Cramps', severity: true, fields: [] },
    ],
  },
  {
    group: 'Digestive',
    symptoms: [
      { key: 'bloating', label: 'Bloating', severity: true, fields: [] },
      { key: 'nausea', label: 'Nausea', severity: true, fields: [] },
      { key: 'constipation', label: 'Constipation', severity: true, fields: [] },
      { key: 'diarrhea', label: 'Diarrhea', severity: true, fields: [] },
      {
        key: 'appetiteChange',
        label: 'Appetite Change',
        severity: true,
        fields: [
          { name: 'direction', label: 'Direction', type: 'single', choices: ['More', 'Less'] },
        ],
      },
    ],
  },
  {
    group: 'Skin & Hair',
    symptoms: [
      {
        key: 'acne',
        label: 'Acne',
        severity: true,
        fields: [
          { name: 'location', label: 'Location', type: 'multi', choices: ['Cheeks', 'Forehead', 'Nose', 'Chin'] },
          { name: 'type', label: 'Type', type: 'multi', choices: ['Whitehead', 'Cystic'] },
        ],
      },
      {
        key: 'drySkin',
        label: 'Dry Skin',
        severity: true,
        fields: [
          { name: 'location', label: 'Location', type: 'multi', choices: ['Hands', 'Arms', 'Legs', 'Face'] },
        ],
      },
      { key: 'hairLoss', label: 'Hair Loss', severity: true, fields: [] },
    ],
  },
  {
    group: 'Temperature Regulation',
    symptoms: [
      { key: 'hotFlashes', label: 'Hot Flashes', severity: true, fields: [] },
      { key: 'chills', label: 'Chills', severity: true, fields: [] },
    ],
  },
  {
    group: 'Sleep & Energy',
    symptoms: [
      { key: 'fatigue', label: 'Fatigue', severity: true, fields: [] },
      {
        key: 'sleepChanges',
        label: 'Sleep Changes',
        severity: false,
        fields: [
          { name: 'direction', label: 'Type', type: 'single', choices: ['Insomnia', 'Oversleeping'] },
        ],
      },
    ],
  },
  {
    group: 'Cognitive & Mood',
    symptoms: [
      { key: 'moodChange', label: 'Mood Change', severity: true, fields: [] },
      { key: 'brainFog', label: 'Brain Fog', severity: true, fields: [] },
    ],
  },
  {
    group: 'Reproductive',
    symptoms: [
      { key: 'vaginalDryness', label: 'Vaginal Dryness', severity: true, fields: [] },
    ],
  },
]

export const symptomByKey = Object.fromEntries(
  symptomCatalog.flatMap(g => g.symptoms).map(s => [s.key, s])
)
