import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

// Shared login/signup form — mode is 'login' or 'signup'.
function AuthForm({ mode }) {
  const { login, signup } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (isLogin) await login(username, password)
      else await signup(username, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF1F6] flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-semibold text-[#13293E] mb-2">CycleLog</h1>
      <p className="text-gray-500 mb-8">{isLogin ? 'Welcome' : 'Create your account'}</p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-[#D25058]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#13293E] text-white py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
        >
          {submitting ? 'Please wait…' : isLogin ? 'Log In' : 'Sign Up'}
        </button>

        <p className="text-sm text-gray-500 text-center">
          {isLogin ? (
            <>No account? <Link to="/signup" className="text-[#13293E] font-medium hover:underline">Sign up</Link></>
          ) : (
            <>Already have an account? <Link to="/login" className="text-[#13293E] font-medium hover:underline">Log in</Link></>
          )}
        </p>
      </form>
    </div>
  )
}

export default AuthForm
