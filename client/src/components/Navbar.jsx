import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="flex items-center gap-8 bg-[#13293E] px-8 py-4">
      <span className="text-white font-semibold text-lg mr-auto">CycleLog</span>
      <Link to="/" className="text-white hover:text-[#77D4F9] transition-colors">Dashboard</Link>
      <Link to="/log" className="text-white hover:text-[#77D4F9] transition-colors">Log Entry</Link>
      <Link to="/history" className="text-white hover:text-[#77D4F9] transition-colors">History</Link>
      <Link to="/calendar" className="text-white hover:text-[#77D4F9] transition-colors">Calendar</Link>
      <Link to="/medication" className="text-white hover:text-[#77D4F9] transition-colors">Medication</Link>
      {user && (
        <>
          <span className="text-white/60 text-sm">{user.email}</span>
          <button onClick={handleLogout} className="text-white hover:text-[#77D4F9] transition-colors">
            Log Out
          </button>
        </>
      )}
    </nav>
  )
}

export default Navbar
