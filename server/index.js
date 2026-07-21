require('dotenv').config()

const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const app = express()
const PORT = 3000
const JWT_SECRET = process.env.JWT_SECRET
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// httpOnly cookies require an exact origin (not '*') and credentials enabled
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// --- auth helpers ---

// issue a JWT and set it as an httpOnly cookie the browser sends automatically
function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
  res.cookie('token', token, {
    httpOnly: true,       // JS can't read it → safe from XSS token theft
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

// never send the password hash back to the client
function publicUser(user) {
  const { password, ...rest } = user
  return rest
}

// gate for every data route: verify the cookie's token, attach req.userId
function requireAuth(req, res, next) {
  const token = req.cookies.token
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const { userId } = jwt.verify(token, JWT_SECRET)
    req.userId = userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

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

app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'An account with that email already exists' })
  }
  const hashed = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, password: hashed } })
  setAuthCookie(res, user.id)
  res.json(publicUser(user))
})

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body
  const user = await prisma.user.findUnique({ where: { email } })
  // same generic message whether email or password is wrong — don't reveal which
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  setAuthCookie(res, user.id)
  res.json(publicUser(user))
})

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token')
  res.json({ ok: true })
})

app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.json(publicUser(user))
})

app.put('/api/users/me', requireAuth, async (req, res) => {
  const { typicalCycleLengthDays } = req.body
  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { typicalCycleLengthDays },
  })
  res.json(publicUser(user))
})

app.get('/api/cycles', requireAuth, async (req, res) => {
  await autoEndStaleCycle(req.userId)
  const cycles = await prisma.cycle.findMany({ where: { userId: req.userId } })
  res.json(cycles)
})

app.post('/api/cycles', requireAuth, async (req, res) => {
  const { startDate, endDate } = req.body

  // only one cycle can be ongoing at a time — blocks double-submits and overlapping cycles
  if (!endDate) {
    const existing = await prisma.cycle.findFirst({
      where: { userId: req.userId, endDate: null },
    })
    if (existing) {
      return res.status(409).json({ error: 'A cycle is already in progress — end it first' })
    }
  }

  const cycle = await prisma.cycle.create({
    data: {
      userId: req.userId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
    }
  })
  res.json(cycle)
})

app.put('/api/cycles/:id', requireAuth, async (req, res) => {
  const { endDate } = req.body
  // ownership check: only update a cycle that belongs to the requester (guards against
  // editing someone else's cycle by guessing its id — an IDOR vulnerability)
  const existing = await prisma.cycle.findUnique({ where: { id: Number(req.params.id) } })
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: 'Cycle not found' })
  }
  const cycle = await prisma.cycle.update({
    where: { id: Number(req.params.id) },
    data: { endDate: new Date(endDate) },
  })
  res.json(cycle)
})

app.get('/api/symptoms', requireAuth, async (req, res) => {
  const symptoms = await prisma.symptomLog.findMany({
    where: { userId: req.userId },
    include: { entries: true },
  })
  res.json(symptoms)
})

app.post('/api/symptoms', requireAuth, async (req, res) => {
  const { date, flow, moods, notes, entries } = req.body
  const userId = req.userId
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
  let cycle = null
  let cycleStarted = false
  if (flow) {
    const logDay = new Date(utcMidnight(date))
    const overlapping = await prisma.cycle.findFirst({
      where: {
        userId,
        startDate: { lte: logDay },
        OR: [
          { endDate: null },
          { endDate: { gte: logDay } },
        ],
      },
    })
    if (!overlapping) {
      // flow logged up to GAP days before an existing cycle's start belongs to
      // that same period — pull the cycle's start date back to this log
      const startsJustAfter = await prisma.cycle.findFirst({
        where: {
          userId,
          startDate: {
            gt: logDay,
            lte: new Date(logDay.getTime() + CYCLE_END_GAP_DAYS * MS_PER_DAY),
          },
        },
        orderBy: { startDate: 'asc' },
      })
      const activeCycle = await prisma.cycle.findFirst({ where: { userId, endDate: null } })
      if (startsJustAfter) {
        cycle = await prisma.cycle.update({
          where: { id: startsJustAfter.id },
          data: { startDate: logDay },
        })
      } else if (!activeCycle) {
        cycle = await prisma.cycle.create({
          data: { userId, startDate: logDay },
        })
        cycleStarted = true
      }
    }
  }

  res.json({ log: symptom, cycle, cycleStarted })
})

app.get('/api/medications', requireAuth, async (req, res) => {
  const medications = await prisma.medicationLog.findMany({ where: { userId: req.userId } })
  res.json(medications)
})

app.post('/api/medications', requireAuth, async (req, res) => {
  const { name, doseMg, takenAt, notes } = req.body
  const medication = await prisma.medicationLog.create({
    data: {
      userId: req.userId,
      name,
      doseMg,
      takenAt: new Date(takenAt),
      notes,
    }
  })
  res.json(medication)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} — auth enabled`)
})
