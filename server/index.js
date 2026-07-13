require('dotenv').config()

const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const app = express()
const PORT = 3000
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

app.use(cors())
app.use(express.json())

// a cycle auto-ends once this many days pass with no flow logged
const CYCLE_END_GAP_DAYS = 3
const MS_PER_DAY = 1000 * 60 * 60 * 24

function utcMidnight(date) {
  const d = new Date(date)
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

// Lazy substitute for a scheduled job: whenever cycles are read or a log is saved,
// close the active cycle if flow stopped CYCLE_END_GAP_DAYS+ days ago.
// endDate is backdated to the last flow day, not "today".
async function autoEndStaleCycle(userId) {
  const active = await prisma.cycle.findFirst({ where: { userId, endDate: null } })
  if (!active) return

  const lastFlowLog = await prisma.symptomLog.findFirst({
    where: {
      userId,
      flow: { not: null },
      NOT: { flow: '' },
      date: { gte: active.startDate },
    },
    orderBy: { date: 'desc' },
  })
  const lastFlowDay = utcMidnight(lastFlowLog?.date ?? active.startDate)

  const daysSinceFlow = Math.floor((utcMidnight(new Date()) - lastFlowDay) / MS_PER_DAY)
  if (daysSinceFlow >= CYCLE_END_GAP_DAYS) {
    await prisma.cycle.update({
      where: { id: active.id },
      data: { endDate: new Date(lastFlowDay) },
    })
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.post('/api/users', async (req, res) => {
  const { email } = req.body
  const user = await prisma.user.create({
    data: { email }
  })
  res.json(user)
})

app.get('/api/cycles', async (req, res) => {
  await autoEndStaleCycle(1)
  const cycles = await prisma.cycle.findMany()
  res.json(cycles)
})

app.post('/api/cycles', async (req, res) => {
  const { userId, startDate, endDate } = req.body

  // only one cycle can be ongoing at a time — blocks double-submits and overlapping cycles
  if (!endDate) {
    const existing = await prisma.cycle.findFirst({
      where: { userId, endDate: null },
    })
    if (existing) {
      return res.status(409).json({ error: 'A cycle is already in progress — end it first' })
    }
  }

  const cycle = await prisma.cycle.create({
    data: {
      userId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    }
  })
  res.json(cycle)
})

app.put('/api/cycles/:id', async (req, res) => {
  const { endDate } = req.body
  const cycle = await prisma.cycle.update({
    where: { id: Number(req.params.id) },
    data: { endDate: new Date(endDate) },
  })
  res.json(cycle)
})

app.get('/api/symptoms', async (req, res) => {
  const symptoms = await prisma.symptomLog.findMany({ include: { entries: true } })
  res.json(symptoms)
})

app.post('/api/symptoms', async (req, res) => {
  const { userId, date, flow, moods, notes, entries } = req.body
  const data = { userId, date: new Date(date), flow, moods, notes }

  // close a stale cycle BEFORE saving this log: if this log carries flow after a
  // long gap, saving it first would make the old cycle look fresh again ("last
  // flow: today"), masking the staleness and merging two periods into one cycle
  await autoEndStaleCycle(userId)

  const symptom = await prisma.$transaction(async (tx) => {
    const log = await tx.symptomLog.upsert({
      where: { userId_date: { userId, date: new Date(date) } },
      update: data,
      create: data,
    })
    await tx.symptomEntry.deleteMany({ where: { symptomLogId: log.id } })
    if (entries?.length) {
      await tx.symptomEntry.createMany({
        data: entries.map(e => ({
          symptomLogId: log.id,
          key: e.key,
          severity: e.severity,
          details: e.details,
        })),
      })
    }
    return tx.symptomLog.findUnique({ where: { id: log.id }, include: { entries: true } })
  })

  // logging flow starts a cycle automatically — but not if one is active,
  // and not if this log is a backfilled day inside an already-recorded cycle
  let newCycle = null
  if (flow) {
    const logDay = utcMidnight(date)
    const overlapping = await prisma.cycle.findFirst({
      where: {
        userId,
        startDate: { lte: new Date(logDay) },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date(logDay) } },
        ],
      },
    })
    const activeCycle = await prisma.cycle.findFirst({ where: { userId, endDate: null } })
    if (!overlapping && !activeCycle) {
      newCycle = await prisma.cycle.create({
        data: { userId, startDate: new Date(logDay) },
      })
    }
  }

  res.json({ log: symptom, cycle: newCycle })
})

app.get('/api/medications', async (req, res) => {
  const medications = await prisma.medicationLog.findMany()
  res.json(medications)
})

app.post('/api/medications', async (req, res) => {
  const { userId, name, doseMg, takenAt, notes } = req.body
  const medication = await prisma.medicationLog.create({
    data: {
      userId,
      name,
      doseMg,
      takenAt: new Date(takenAt),
      notes,
    }
  })
  res.json(medication)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
