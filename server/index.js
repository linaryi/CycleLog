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
  const cycles = await prisma.cycle.findMany()
  res.json(cycles)
})

app.post('/api/cycles', async (req, res) => {
  const { userId, startDate, endDate } = req.body
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
  const symptoms = await prisma.symptomLog.findMany()
  res.json(symptoms)
})

app.post('/api/symptoms', async (req, res) => {
  const { userId, date, cramps, fatigue, flow, mood, headache, headacheSide, headacheSeverity, bloating, notes } = req.body
  const data = {
    userId,
    date: new Date(date),
    cramps,
    fatigue,
    flow,
    mood,
    headache,
    headacheSide,
    headacheSeverity,
    bloating,
    notes,
  }
  const symptom = await prisma.symptomLog.upsert({
    where: { userId_date: { userId, date: new Date(date) } },
    update: data,
    create: data,
  })
  res.json(symptom)
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
