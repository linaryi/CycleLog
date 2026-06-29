import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/">Dashboard</Link>
      <Link to="/log">Log Entry</Link>
      <Link to="/history">History</Link>
      <Link to="/calendar">Calendar</Link>
    </nav>
  )
}

export default Navbar