import { createContext, useContext, useState, useEffect } from 'react'
import { apiGet, apiPost } from './api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // on load, ask the server who we are (restores the session from the cookie)
  useEffect(() => {
    apiGet('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    setUser(await apiPost('/api/auth/login', { email, password }))
  }

  async function signup(email, password) {
    setUser(await apiPost('/api/auth/signup', { email, password }))
  }

  async function logout() {
    await apiPost('/api/auth/logout', {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
