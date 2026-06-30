import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import LogEntry from './pages/LogEntry'
import History from './pages/History'
import Calendar from './pages/Calendar'
import Medication from './pages/Medication'

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/log" element={<LogEntry />} />
        <Route path="/history" element={<History />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/medication" element={<Medication />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App