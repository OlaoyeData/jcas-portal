import React, { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      authApi.me()
        .then(u => setUser(u))
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password)
      localStorage.setItem('access_token',  data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      const user = await authApi.me()
      setUser(user)
      // Map role to dashboard path
      const rolePathMap = {
        author:          'author',
        reviewer:        'reviewer',
        editor:          'editor',
        editor_in_chief: 'editor_in_chief',
        admin:           'admin',
      }
      return { ok: true, role: rolePathMap[user.role] || user.role }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  const register = async (formData) => {
  try {
    await authApi.register(formData)
    try {
      const data = await authApi.login(formData.email, formData.password)
      localStorage.setItem('access_token',  data.access_token)
      if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token)
      const user = await authApi.me()
      setUser(user)
      return { ok: true, role: user.role }
    } catch (loginErr) {
      return { ok: true, pending: true, message: loginErr.message }
    }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}