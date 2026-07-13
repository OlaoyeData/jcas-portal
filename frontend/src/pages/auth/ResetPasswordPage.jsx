import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle, Mail, KeyRound } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function ResetPasswordPage() {
  const [searchParams]             = useSearchParams()
  const navigate                   = useNavigate()
  const token                      = searchParams.get('token')

  // ── Step 1: Request reset ──────────────────────────────────────────────────
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)

  // ── Step 2: Set new password ───────────────────────────────────────────────
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [done,      setDone]      = useState(false)

  // ── Shared ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // ── Step 1 handler ─────────────────────────────────────────────────────────
  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.includes('@')) { setError('Please enter a valid email address.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/password-reset/request`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Request failed. Please try again.')
      }
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2 handler ─────────────────────────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/auth/password-reset/confirm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, new_password: password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Reset failed. The link may have expired.')
      }
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
        </div>

        {/* ── Success: reset link sent ───────────────────────────────────── */}
        {sent && !token && (
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">Check your inbox</h1>
            <p className="text-gray-500 text-sm mb-6">
              If <span className="font-medium text-gray-700">{email}</span> is registered, we've
              sent a password reset link. It expires in 30 minutes.
            </p>
            <Link to="/login" className="btn-primary w-full justify-center py-3 text-sm">
              Back to Sign In
            </Link>
          </div>
        )}

        {/* ── Success: password changed ──────────────────────────────────── */}
        {done && (
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">Password updated</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your password has been changed. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn-primary w-full justify-center py-3 text-sm"
            >
              Go to Sign In
            </button>
          </div>
        )}

        {/* ── Step 2: Set new password (token present) ──────────────────── */}
        {token && !done && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <KeyRound className="text-blue-600" size={22} />
              </div>
              <h1 className="text-2xl font-bold text-navy-900 mb-1">Set a new password</h1>
              <p className="text-gray-500 text-sm">Choose a strong password for your account.</p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            <div className="card p-8">
              <form onSubmit={handleConfirm} className="space-y-4">

                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="form-input pr-10"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">Confirm Password</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat new password"
                    className="form-input"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center py-3 text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── Step 1: Request reset (no token, not sent yet) ─────────────── */}
        {!token && !sent && (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
                <Mail className="text-blue-600" size={22} />
              </div>
              <h1 className="text-2xl font-bold text-navy-900 mb-1">Forgot your password?</h1>
              <p className="text-gray-500 text-sm">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            <div className="card p-8">
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@institution.edu"
                    className="form-input"
                    autoComplete="email"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary justify-center py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 font-medium hover:underline">
                Back to Sign In
              </Link>
            </p>
          </>
        )}

      </div>
    </div>
  )
}