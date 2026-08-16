import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

const LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/log', label: 'Log Entry' },
  { to: '/history', label: 'History' },
  { to: '/calendar', label: 'Calendar' },
  { to: '/medication', label: 'Medication' },
]

function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-[#13293E] px-4 sm:px-8 py-4 relative">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-white font-semibold text-lg mr-auto hover:text-[#77D4F9] transition-colors">CycleLog</Link>

        {/* full link row: shown from lg (1024px) up, so iPad landscape gets it too */}
        <div className="hidden lg:flex items-center gap-8">
          {LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="text-white hover:text-[#77D4F9] transition-colors">
              {label}
            </Link>
          ))}
          {user && (
            <>
              <span className="text-white/60 text-sm">{user.username}</span>
              <button onClick={handleLogout} className="text-white hover:text-[#77D4F9] transition-colors">
                Log Out
              </button>
            </>
          )}
        </div>

        {/* mobile/tablet: hamburger toggle */}
        <button
          onClick={() => setMenuOpen(open => !open)}
          className="lg:hidden text-white p-1"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* mobile/tablet dropdown */}
      {menuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#13293E] px-4 sm:px-8 pb-4 flex flex-col gap-3 shadow-lg z-10">
          {LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="text-white hover:text-[#77D4F9] transition-colors py-1"
            >
              {label}
            </Link>
          ))}
          {user && (
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <span className="text-white/60 text-sm">{user.username}</span>
              <button onClick={handleLogout} className="text-white hover:text-[#77D4F9] transition-colors">
                Log Out
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
