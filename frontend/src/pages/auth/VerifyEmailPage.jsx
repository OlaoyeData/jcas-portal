import React, { useEffect, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { CheckCircle, AlertCircle, MailCheck } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate        = useNavigate()
  const token            = searchParams.get('token')

  const [status,  setStatus]  = useState(token ? 'verifying' : 'missing')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    const run = async () => {
      try {
        const res = await fetch(`${API}/auth/verify-email`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ token }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.detail || 'Verification failed. The link may have expired.')
        setMessage(data.detail || 'Email confirmed successfully.')
        setStatus('done')
      } catch (err) {
        setMessage(err.message)
        setStatus('error')
      }
    }
    run()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
        </div>
        <div className="card p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-4">
                <MailCheck className="text-blue-600 animate-pulse" size={48} />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Confirming your email…</h1>
              <p className="text-gray-500 text-sm">This will only take a moment.</p>
            </>
          )}
          {status === 'done' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="text-green-500" size={48} />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Email confirmed</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3 text-sm">
                Go to Sign In
              </button>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="text-red-500" size={48} />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Verification failed</h1>
              <p className="text-gray-500 text-sm mb-6">{message}</p>
              <Link to="/login" className="btn-primary w-full justify-center py-3 text-sm">
                Back to Sign In
              </Link>
            </>
          )}
          {status === 'missing' && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="text-red-500" size={48} />
              </div>
              <h1 className="text-xl font-bold text-navy-900 mb-2">Missing verification link</h1>
              <p className="text-gray-500 text-sm mb-6">
                This page needs a confirmation token. Please use the link from your email.
              </p>
              <Link to="/login" className="btn-primary w-full justify-center py-3 text-sm">
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}