/**
 * Resets a user's password directly in the database. Use this when someone is
 * locked out and there's no self-service "forgot password" flow yet.
 *
 *   local:      node scripts/resetPassword.js <username> <newPassword>
 *   production: DATABASE_URL="<neon-connection-string>" node scripts/resetPassword.js <username> <newPassword>
 *
 * Only touches the one user named on the command line.
 */
require('dotenv').config()

const bcrypt = require('bcryptjs')
const { Pool } = require('pg')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const [, , username, newPassword] = process.argv

if (!username || !newPassword) {
  console.error('Usage: node scripts/resetPassword.js <username> <newPassword>')
  process.exit(1)
}
if (newPassword.length < 6) {
  console.error('Password must be at least 6 characters (same rule the signup form enforces).')
  process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    console.error(`No user "${username}" found.`)
    process.exitCode = 1
    return
  }
  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
  console.log(`Password reset for "${username}". You can log in with the new password now.`)
}

main()
  .catch(err => {
    console.error('reset failed:', err)
    process.exitCode = 1
  })
  .finally(() => pool.end())
