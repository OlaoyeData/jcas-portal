import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../services/api'

function timeLeft(deadline) {
  const ms = new Date(deadline).getTime() - Date.now()
  if (ms <= 0) return 'less than a minute'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}m` : `${Math.max(m, 1)}m`
}

export default function VerificationBanner() {
  const { user, refreshUser } = useAuth()
  const [, tick]    = useState(0)
  const [sending, setSending] = useState(false)
  const [note, setNote]       = useState('')

  // Re-render every minute for the countdown, and re-check the user when they come back
  // to this tab (they may have just clicked the link in their email in another tab).
  useEffect(() => {
    if (!user?.verification_deadline) return
    const id = setInterval(() => tick(n => n + 1), 60000)
    const onFocus = () => refreshUser()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [user?.verification_deadline, refreshUser])

  if (!user?.verification_deadline || user.is_verified) return null

  const resend = async () => {
    setSending(true); setNote('')
    try {
      await authApi.resendVerify(user.email)
      setNote('Verification email sent. Check your inbox.')
    } catch (e) {
      setNote(e.message || 'Could not send the email. Try again shortly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-red-600 text-white px-4 py-2.5 text-sm flex flex-wrap items-center justify-center gap-x-3 gap-y-1 flex-shrink-0">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>
        Please verify your email within <strong>{timeLeft(user.verification_deadline)}</strong>.
        Unverified accounts are deleted after 24 hours.
      </span>
      <button
        onClick={resend}
        disabled={sending}
        className="underline font-semibold hover:no-underline disabled:opacity-60"
      >
        {sending ? 'Sending…' : 'Resend email'}
      </button>
      {note && <span className="text-red-100">{note}</span>}
    </div>
  )
}
