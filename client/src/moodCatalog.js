// Tiered mood picker: pick a broad tier first, then a specific emotion within it.
// Colors are per-emotion (not per-tier) so they carry semantic meaning —
// reds for anger/anxiety, blues for sadness/fatigue, greens for calm, yellows for positive/energized.
// Tier buttons (Low/Neutral/Up) stay a neutral color since a single tier color
// can't represent the mix of emotion colors within it.
//
// `icon` is a placeholder for custom drawn emotes: drop image files in
// client/src/assets/moods/, import them at the top of this file
// (e.g. `import sadIcon from '../assets/moods/sad.png'`), and set `icon: sadIcon`
// on that emotion. MoodPicker already renders `icon` in place of the color dot
// when it's set, so no other code changes are needed once art exists.
export const moodCatalog = [
  {
    tier: 'low',
    label: 'Low',
    emotions: [
      { name: 'Sad', color: '#8FB8E0', icon: null },
      { name: 'Lonely', color: '#8FB8E0', icon: null },
      { name: 'Tired', color: '#8FB8E0', icon: null },
      { name: 'Anxious', color: '#E4767C', icon: null },
      { name: 'Angry', color: '#E4767C', icon: null },
      { name: 'Irritable', color: '#E4767C', icon: null },
      { name: 'Stressed', color: '#BCB6E2', icon: null },
      { name: 'Frustrated', color: '#E4767C', icon: null },
      { name: 'Grumpy', color: '#E4767C', icon: null },
      { name: 'Overwhelmed', color: '#BCB6E2', icon: null },
      { name: 'Sick', color: '#9CC9A1', icon: null },
    ],
  },
  {
    tier: 'neutral',
    label: 'Neutral',
    emotions: [
      { name: 'Calm', color: '#9CC9A1', icon: null },
      { name: 'Content', color: '#9CC9A1', icon: null },
      { name: 'Relaxed', color: '#9CC9A1', icon: null },
      { name: 'Indifferent', color: '#D9CBA0', icon: null },
      { name: 'Lazy', color: '#D9CBA0', icon: null },
      { name: 'Okay', color: '#D9CBA0', icon: null },
    ],
  },
  {
    tier: 'up',
    label: 'Up',
    emotions: [
      { name: 'Happy', color: '#F2C879', icon: null },
      { name: 'Excited', color: '#F2C879', icon: null },
      { name: 'Confident', color: '#F2C879', icon: null },
      { name: 'Energetic', color: '#F2C879', icon: null },
      { name: 'Hopeful', color: '#F2C879', icon: null },
    ],
  },
]

export const moodTierByKey = Object.fromEntries(moodCatalog.map(t => [t.tier, t]))

export const moodEmotionByName = Object.fromEntries(
  moodCatalog.flatMap(t => t.emotions).map(e => [e.name, e])
)
