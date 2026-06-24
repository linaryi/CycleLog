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
  const { userId, startDate } = req.body
  const cycle = await prisma.cycle.create({
    data: {
      userId,
      startDate: new Date(startDate),
    }
  })
  res.json(cycle)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
