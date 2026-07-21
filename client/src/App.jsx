import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './AuthContext'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import History from './pages/History'
import Calendar from './pages/Calendar'
import Medication from './pages/Medication'
import AuthForm from './pages/AuthForm'

// Renders the protected app when logged in, else bounces to /login.
function ProtectedApp() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#FAF1F6]" />
  if (!user) return <Navigate to="/login" replace />
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogEntry />} />
        <Route path="/history" element={<History />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/medication" element={<Medication />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

// If already logged in, keep auth pages from showing — send to the app.
function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-[#FAF1F6]" />
  if (user) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><AuthForm mode="login" /></PublicOnly>} />
          <Route path="/signup" element={<PublicOnly><AuthForm mode="signup" /></PublicOnly>} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
