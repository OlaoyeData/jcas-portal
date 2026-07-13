import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { authApi } from '../../services/api'

export default function AcceptInvitationPage() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [invitation, setInvitation] = useState(null)
  const [loadError,  setLoadError]  = useState('')
  const [loading,    setLoading]    = useState(true)

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [submitting,setSubmitting]= useState(false)
  const [error,     setError]     = useState('')
  const [done,      setDone]      = useState(false)

  useEffect(() => {
    authApi.getInvitation(token)
      .then(data => setInvitation(data))
      .catch(err => setLoadError(err.message || 'Invalid or expired invitation link.'))
      .finally(() => setLoading(false))
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 8)              { setError('Password must be at least 8 characters.'); return }
    if (!/[a-zA-Z]/.test(password))       { setError('Password must contain at least one letter.'); return }
    if (!/[0-9]/.test(password))          { setError('Password must contain at least one number.'); return }
    if (password !== confirm)             { setError('Passwords do not match.'); return }
    setSubmitting(true)
    try {
      await authApi.acceptInvitation({ token, password })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      <Loader size={24} className="animate-spin mr-2" /> Validating invitation…
    </div>
  )

  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
        <h2 className="text-lg font-bold text-gray-800 mb-2">Invalid Invitation</h2>
        <p className="text-sm text-gray-500 mb-4">{loadError}</p>
        <Link to="/login" className="btn-outline text-sm">Back to Login</Link>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="text-center max-w-md card p-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Account Created!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Welcome to JCAS, {invitation?.name}. Your{' '}
          <strong>{invitation?.role?.replace('_', ' ')}</strong> account is ready.
        </p>
        <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center">
          Go to Login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
        </div>
        <div className="card p-8">
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Accept Invitation</h1>
          <p className="text-sm text-gray-500 mb-6">
            You've been invited as a{' '}
            <strong>{invitation?.role?.replace('_', ' ')}</strong>. Set your password to get started.
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 mb-5">
            <p className="text-xs text-gray-500">Name</p>
            <p className="text-sm font-semibold text-gray-800">{invitation?.name}</p>
            <p className="text-xs text-gray-500 mt-2">Email</p>
            <p className="text-sm font-semibold text-gray-800">{invitation?.email}</p>
          </div>
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters with letters and numbers"
                  className="form-input pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="form-label">Confirm Password</label>
              <input type="password" value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password" className="form-input" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full btn-primary justify-center py-3 text-sm disabled:opacity-60">
              {submitting ? 'Creating account…' : 'Create My Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}