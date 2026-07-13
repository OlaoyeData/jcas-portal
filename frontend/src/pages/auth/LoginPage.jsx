import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setError('')
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) navigate(`/dashboard/${result.role}`)
    else setError(result.error || 'Invalid email or password.')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy-950 text-white p-12">
        <Link to="/" className="text-2xl font-display font-bold">JCAS</Link>
        <div>
          <blockquote className="text-xl text-blue-200 italic leading-relaxed mb-6">
            "Advancing the frontiers of computing through rigorous, open-access scholarship."
          </blockquote>
          <div className="grid grid-cols-2 gap-4">
            {[
              ['150+', 'Published Articles'],
              ['45',   'Active Reviewers'  ],
              ['28%',  'Acceptance Rate'   ],
              ['42d',  'Avg. Decision Time'],
            ].map(([v, l]) => (
              <div key={l} className="bg-white/10 rounded-lg p-3">
                <p className="text-2xl font-bold">{v}</p>
                <p className="text-xs text-blue-300 mt-0.5">{l}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-gray-600">© 2026 Adekunle Ajasin University. JCAS.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
          </div>

          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-navy-700 mb-6 transition-colors">
            ← Back to Homepage
          </Link>

          <h1 className="text-3xl font-bold text-navy-900 mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-8">Sign in to your researcher account</p>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle size={15} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@institution.edu" className="form-input" autoComplete="email" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="form-label mb-0">Password</label>
                <Link to="/reset-password" className="text-xs text-blue-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password" className="form-input pr-10"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary justify-center py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}