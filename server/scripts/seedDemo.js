/**
 * Seeds (or resets) the public demo account.
 *
 *   local:      node scripts/seedDemo.js
 *   production: DATABASE_URL="<neon-connection-string>" node scripts/seedDemo.js
 *
 * Safe to re-run — it deletes the demo user's existing data first, so the demo
 * can be reset after visitors poke at it. Touches ONLY the demo account.
 *
 * Dates are generated relative to today, so the demo never looks stale.
 */
require('dotenv').config()

const bcrypt = require('bcryptjs')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const DEMO_USERNAME = 'tester'
const DEMO_PASSWORD = 'test123'
const MS_PER_DAY = 24 * 60 * 60 * 1000

// UTC midnight N days before today — matches how the app stores/compares dates
function daysAgo(n) {
  const now = new Date()
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return new Date(todayUtc - n * MS_PER_DAY)
}

// Cycles ~28-30 days apart (start to start), which is what the prediction averages.
// The most recent one is still active so the dashboard shows a live "Day N".
const CYCLES = [
  { startsAgo: 90, flowDays: 6 },
  { startsAgo: 62, flowDays: 5 },
  { startsAgo: 33, flowDays: 6 },
  { startsAgo: 3, flowDays: 4, active: true },
]

const FLOW_BY_DAY = ['heavy', 'heavy', 'medium', 'light', 'light', 'light']

// Symptoms clustered on the early days, the way they actually behave. `everyCycle:
// false` entries appear only in some cycles so the "seen / out of" likelihood
// fractions vary instead of all reading 4/4.
const SYMPTOMS_BY_DAY = [
  [
    { key: 'cramps', severity: 'high', everyCycle: true },
    { key: 'fatigue', severity: 'mid', everyCycle: true },
    { key: 'headache', severity: 'mid', details: { side: ['Left'] }, everyCycle: false },
    { key: 'lowerBackPain', severity: 'mid', everyCycle: false },
  ],
  [
    { key: 'cramps', severity: 'mid', everyCycle: true },
    { key: 'bloating', severity: 'mid', everyCycle: true },
    { key: 'nausea', severity: 'low', everyCycle: false },
  ],
  [
    { key: 'fatigue', severity: 'low', everyCycle: true },
    { key: 'acne', severity: 'mid', details: { location: ['Chin'], type: ['Cystic'] }, everyCycle: false },
  ],
  [
    { key: 'acne', severity: 'low', details: { location: ['Cheeks'], type: ['Whitehead'] }, everyCycle: true },
    { key: 'moodChange', severity: 'mid', everyCycle: false },
  ],
  [{ key: 'acne', severity: 'low', details: { location: ['Forehead'] }, everyCycle: false }],
  [{ key: 'fatigue', severity: 'low', everyCycle: false }],
]

const MOODS_BY_DAY = [
  ['Tired', 'Irritable'],
  ['Tired', 'Stressed'],
  ['Okay', 'Lazy'],
  ['Okay'],
  ['Content'],
  ['Calm'],
]

const NOTES_BY_DAY = {
  0: 'Rough first day — heating pad helped.',
  3: 'Feeling much more like myself.',
}

// A few mid-cycle days so the app isn't only populated during periods.
const MID_CYCLE_LOGS = [
  { daysAfterStart: 12, moods: ['Happy', 'Energetic'], symptoms: [] },
  { daysAfterStart: 16, moods: ['Content'], symptoms: [{ key: 'brainFog', severity: 'low' }] },
  { daysAfterStart: 22, moods: ['Anxious', 'Stressed'], symptoms: [{ key: 'breastPain', severity: 'low', details: { side: ['Left', 'Right'] } }] },
]

async function main() {
  // --- reset: remove the demo account and everything it owns ---
  const existing = await prisma.user.findUnique({ where: { username: DEMO_USERNAME } })
  if (existing) {
    // SymptomEntry rows cascade when their SymptomLog is deleted
    await prisma.symptomLog.deleteMany({ where: { userId: existing.id } })
    await prisma.cycle.deleteMany({ where: { userId: existing.id } })
    await prisma.medicationLog.deleteMany({ where: { userId: existing.id } })
    await prisma.user.delete({ where: { id: existing.id } })
    console.log('removed previous demo account')
  }

  const user = await prisma.user.create({
    data: {
      username: DEMO_USERNAME,
      password: await bcrypt.hash(DEMO_PASSWORD, 10),
    },
  })
  console.log(`created user "${DEMO_USERNAME}" (id ${user.id})`)

  let cycleCount = 0
  let logCount = 0

  for (const [cycleIndex, cycle] of CYCLES.entries()) {
    const startDate = daysAgo(cycle.startsAgo)
    const lastFlowDay = daysAgo(cycle.startsAgo - (cycle.flowDays - 1))

    await prisma.cycle.create({
      data: {
        userId: user.id,
        startDate,
        endDate: cycle.active ? null : lastFlowDay,
      },
    })
    cycleCount++

    // flow days
    for (let day = 0; day < cycle.flowDays; day++) {
      const date = daysAgo(cycle.startsAgo - day)
      if (date > new Date()) continue // never log the future

      const entries = (SYMPTOMS_BY_DAY[day] ?? [])
        // vary which optional symptoms appear, deterministically
        .filter(s => s.everyCycle || (cycleIndex + day) % 2 === 0)
        .map(s => ({ key: s.key, severity: s.severity, details: s.details ?? {} }))

      await prisma.symptomLog.create({
        data: {
          userId: user.id,
          date,
          flow: FLOW_BY_DAY[day] ?? 'light',
          moods: MOODS_BY_DAY[day] ?? ['Okay'],
          notes: NOTES_BY_DAY[day] ?? null,
          entries: { create: entries },
        },
      })
      logCount++
    }

    // mid-cycle days (skip for the active cycle — those days haven't happened yet)
    if (cycle.active) continue
    for (const mid of MID_CYCLE_LOGS) {
      const date = daysAgo(cycle.startsAgo - mid.daysAfterStart)
      if (date > new Date()) continue

      await prisma.symptomLog.create({
        data: {
          userId: user.id,
          date,
          flow: null,
          moods: mid.moods,
          notes: null,
          entries: {
            create: mid.symptoms.map(s => ({
              key: s.key,
              severity: s.severity,
              details: s.details ?? {},
            })),
          },
        },
      })
      logCount++
    }
  }

  await prisma.medicationLog.createMany({
    data: [
      { userId: user.id, name: 'Ibuprofen', doseMg: 400, takenAt: daysAgo(3), notes: 'For cramps' },
      { userId: user.id, name: 'Ibuprofen', doseMg: 400, takenAt: daysAgo(2), notes: null },
      { userId: user.id, name: 'Iron supplement', doseMg: 65, takenAt: daysAgo(33), notes: 'Daily' },
    ],
  })

  console.log(`seeded ${cycleCount} cycles, ${logCount} daily logs, 3 medication entries`)
  console.log(`\nDemo login →  username: ${DEMO_USERNAME}   password: ${DEMO_PASSWORD}`)
}

main()
  .catch(err => {
    console.error('seed failed:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
