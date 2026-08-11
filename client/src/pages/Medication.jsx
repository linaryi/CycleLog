import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../api'

function Medication() {
  const [medications, setMedications] = useState([])
  const [name, setName] = useState('')
  const [doseMg, setDoseMg] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    apiGet('/api/medications').then(setMedications).catch(() => {})
  }, [])

  async function handleSubmit() {
    const data = await apiPost('/api/medications', {
      name,
      doseMg: Number(doseMg),
      takenAt: new Date().toLocaleDateString('en-CA'),
      notes,
    })
    setMedications([data, ...medications])
    setName('')
    setDoseMg('')
    setNotes('')
  }

  const sorted = [...medications].sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt))

  return (
    <div className="min-h-screen bg-[#FAF1F6] p-4 sm:p-8 flex flex-col items-center">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-8">Medication Log</h1>

      <div className="w-full max-w-xl flex flex-col gap-6">

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Log a Dose</h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Medication name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Dose (mg)</label>
              <input type="number" value={doseMg} onChange={(e) => setDoseMg(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" rows={2} />
          </div>

          <button onClick={handleSubmit} className="w-full bg-[#13293E] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
            Log Medication
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">History</h2>

          {sorted.length === 0 ? (
            <p className="text-gray-400">No medications logged yet</p>
          ) : (
            <div className="flex flex-col gap-3">
              {sorted.map(entry => (
                <div key={entry.id} className="border border-gray-200 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[#13293E] font-medium">{entry.name}{entry.doseMg ? ` — ${entry.doseMg}mg` : ''}</p>
                    <p className="text-xs text-gray-500">{new Date(entry.takenAt).toLocaleDateString()}</p>
                  </div>
                  {entry.notes && <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default Medication
