import { useState, useEffect } from 'react'
import ReactCalendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'

function Calendar() {
  const [symptoms, setSymptoms] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/symptoms')
      .then(res => res.json())
      .then(data => setSymptoms(data))
  }, [])

  const loggedDates = symptoms.map(entry => {
    const d = new Date(entry.date)
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`
  })

  function tileClassName({ date }) {
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (loggedDates.includes(dateStr)) {
        return 'logged-day'
    }
  }

  console.log('logged dates:', loggedDates)

  return (
    <div>
      <h1>Calendar</h1>
      <ReactCalendar tileClassName={tileClassName} />
    </div>
  )
}

export default Calendar