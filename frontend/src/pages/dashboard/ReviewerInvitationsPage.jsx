import React, { useEffect, useState } from 'react'
import { Clock, CheckCircle, XCircle, Shield, AlertTriangle } from 'lucide-react'
import { reviewsApi } from '../../services/api'

function daysLeft(deadline) {
  if (!deadline) return null
  return Math.max(0, Math.ceil((new Date(deadline) - new Date()) / 86400000))
}

function CountdownBadge({ deadline }) {
  const days = daysLeft(deadline)
  if (days === null) return null
  const color =
    days <= 7  ? 'text-red-600 bg-red-50 border-red-200' :
    days <= 14 ? 'text-orange-600 bg-orange-50 border-orange-200' :
                 'text-gray-600 bg-gray-50 border-gray-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-semibold ${color}`}>
      <Clock size={11} /> {days} day{days !== 1 ? 's' : ''} remaining
    </span>
  )
}

export default function ReviewerInvitationsPage() {
  const [invitations,  setInvitations]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [coiModal,     setCoiModal]     = useState(null)
  const [coiText,      setCoiText]      = useState('')
  const [coiConfirmed, setCoiConfirmed] = useState(false)

  useEffect(() => {
    reviewsApi.myInvitations()
      .then(data => setInvitations(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleAccept = async () => {
    if (!coiConfirmed) return
    try {
      await reviewsApi.respond(coiModal, true, coiText || null)
      setInvitations(p => p.filter(i => i.id !== coiModal))
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setCoiModal(null)
      setCoiText('')
      setCoiConfirmed(false)
    }
  }

  const handleDecline = async (id, reason) => {
    try {
      await reviewsApi.respond(id, false, reason)
      setInvitations(p => p.filter(i => i.id !== id))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* COI Modal */}
      {coiModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-navy-700" />
              <h3 className="text-base font-bold text-navy-900">
                Conflict of Interest Declaration
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Before accepting this review assignment, please declare any potential
              conflicts of interest including personal relationships with authors,
              financial interests, or prior knowledge of the work.
            </p>
            <div className="mb-4">
              <label className="form-label">Declaration Statement</label>
              <textarea
                value={coiText}
                onChange={e => setCoiText(e.target.value)}
                rows={3}
                placeholder="e.g. I declare no conflict of interest with this manuscript."
                className="form-input text-sm resize-none"
              />
            </div>
            <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={coiConfirmed}
                onChange={e => setCoiConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-navy-700 flex-shrink-0"
              />
              <span className="text-sm text-gray-700">
                I confirm I have no conflicts of interest that would prevent me from
                conducting a fair and unbiased review of this manuscript.
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCoiModal(null)
                  setCoiText('')
                  setCoiConfirmed(false)
                }}
                className="btn-outline flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleAccept}
                disabled={!coiConfirmed}
                className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
              >
                Accept &amp; Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Pending Invitations
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Review invitations awaiting your response.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : invitations.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckCircle size={36} className="mx-auto text-green-300 mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No pending invitations</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            You will receive an email notification when a new review invitation arrives.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map(inv => (
            <InvitationCard
              key={inv.id}
              inv={inv}
              onAccept={() => setCoiModal(inv.id)}
              onDecline={handleDecline}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InvitationCard({ inv, onAccept, onDecline }) {
  const [declining, setDeclining] = useState(false)
  const [reason,    setReason]    = useState('')

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 font-medium">
              Assignment #{inv.id}
            </span>
            {inv.manuscript_id && (
              <span className="text-xs text-gray-400">
                · Manuscript #{inv.manuscript_id}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-navy-900 text-sm leading-snug">
            {inv.title || `Manuscript #${inv.manuscript_id}`}
          </h3>
        </div>
        <CountdownBadge deadline={inv.deadline} />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
        <span>
          Assigned:{' '}
          {new Date(inv.assigned_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
        {inv.deadline && (
          <span>
            Deadline:{' '}
            {new Date(inv.deadline).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </span>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-800 mb-4 flex items-start gap-2">
        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
        A conflict of interest declaration is required before accepting.
      </div>

      {declining ? (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Reason for declining (optional)..."
            className="form-input text-sm resize-none w-full"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setDeclining(false)}
              className="btn-outline text-xs py-1.5 px-3"
            >
              Cancel
            </button>
            <button
              onClick={() => onDecline(inv.id, reason)}
              className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-red-700"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex items-center gap-2 bg-navy-900 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            <CheckCircle size={14} /> Accept
          </button>
          <button
            onClick={() => setDeclining(true)}
            className="flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <XCircle size={14} /> Decline
          </button>
        </div>
      )}
    </div>
  )
}