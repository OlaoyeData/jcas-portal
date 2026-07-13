import React, { useState, useEffect } from 'react'
import { Search, UserPlus, Mail, X, Calendar, Loader, CheckCircle } from 'lucide-react'
import { usersApi, manuscriptsApi, reviewsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

export default function EditorReviewersPage() {
  const { user } = useAuth()
  const [reviewers,  setReviewers]  = useState([])
  const [manuscripts,setManuscripts]= useState([])
  const [loading,    setLoading]    = useState(true)
  const [searchQ,    setSearchQ]    = useState('')

  // Invite modal state
  const [inviteTarget,   setInviteTarget]   = useState(null)  // reviewer object
  const [inviteMs,       setInviteMs]       = useState('')
  const [inviteDeadline, setInviteDeadline] = useState('')
  const [inviteLoading,  setInviteLoading]  = useState(false)
  const [inviteSuccess,  setInviteSuccess]  = useState(false)
  const [inviteError,    setInviteError]    = useState('')

  useEffect(() => {
    Promise.all([
      usersApi.reviewers(),
      manuscriptsApi.listAll().catch(() => []),
    ]).then(([revs, mss]) => {
      setReviewers(revs || [])
      // Only show manuscripts that are screened/assignable (for editors: their own; for EiC: all)
      const assignable = (mss || []).filter(m =>
        ['submitted', 'editor_assigned', 'under_review'].includes(m.status) &&
        (user?.role === 'editor_in_chief' || user?.role === 'admin'
          ? m.screened_at
          : m.editor_id === user?.id)
      )
      setManuscripts(assignable)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  const filtered = reviewers.filter(r =>
    !searchQ ||
    r.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.affiliation?.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.expertise_areas?.toLowerCase().includes(searchQ.toLowerCase())
  )

  const openInvite = (rev) => {
    setInviteTarget(rev)
    setInviteMs('')
    setInviteDeadline('')
    setInviteError('')
    setInviteSuccess(false)
  }

  const closeInvite = () => {
    setInviteTarget(null)
    setInviteSuccess(false)
  }

  const handleInvite = async () => {
    if (!inviteMs)       { setInviteError('Please select a manuscript.'); return }
    if (!inviteDeadline) { setInviteError('Please set a review deadline.'); return }
    setInviteLoading(true)
    setInviteError('')
    try {
      await reviewsApi.inviteReviewer(inviteMs, inviteTarget.id, inviteDeadline)
      setInviteSuccess(true)
    } catch (err) {
      setInviteError(err.message || 'Invitation failed. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDeadline = tomorrow.toISOString().split('T')[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Reviewers</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Browse and invite registered reviewers to manuscripts.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Total Reviewers', value: reviewers.length },
          { label: 'Available',       value: reviewers.length },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <p className="text-2xl font-bold text-navy-900">{loading ? '—' : s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by name, expertise, or institution…"
          className="form-input pl-9 text-sm"
        />
      </div>

      {/* Reviewer list */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">
          {reviewers.length === 0
            ? 'No reviewers registered yet.'
            : 'No reviewers match your search.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(rev => (
            <div key={rev.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-navy-100 text-navy-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {rev.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">{rev.name}</p>
                    <p className="text-xs text-gray-500 truncate">{rev.affiliation}</p>
                    {rev.expertise_areas && (
                      <p className="text-xs text-blue-600 mt-0.5 truncate">{rev.expertise_areas}</p>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => openInvite(rev)}
                    className="flex items-center gap-1 text-xs bg-navy-900 text-white px-2.5 py-1.5 rounded-lg hover:bg-navy-800 transition-colors font-semibold"
                  >
                    <UserPlus size={12} /> Invite
                  </button>
                </div>
              </div>
              {rev.email && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                  <Mail size={11} />
                  <span className="truncate">{rev.email}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Invite Modal ────────────────────────────────────────────────── */}
      {inviteTarget && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Invite Reviewer</h3>
              <button onClick={closeInvite} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={22} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Invitation Sent!</p>
                <p className="text-sm text-gray-500 mb-4">
                  {inviteTarget.name} has been invited to review the selected manuscript.
                  They will receive an email notification.
                </p>
                <button onClick={closeInvite} className="btn-primary text-sm py-2 px-6">Done</button>
              </div>
            ) : (
              <>
                {/* Reviewer info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
                  <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {inviteTarget.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{inviteTarget.name}</p>
                    <p className="text-xs text-gray-500">{inviteTarget.affiliation}</p>
                  </div>
                </div>

                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {inviteError}
                  </div>
                )}

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="form-label">
                      Select Manuscript <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={inviteMs}
                      onChange={e => setInviteMs(e.target.value)}
                      className="form-input text-sm"
                    >
                      <option value="">Choose a manuscript…</option>
                      {manuscripts.map(ms => (
                        <option key={ms.id} value={ms.id}>
                          {ms.manuscript_id} — {ms.title?.length > 50
                            ? ms.title.slice(0, 50) + '…'
                            : ms.title}
                        </option>
                      ))}
                    </select>
                    {manuscripts.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No assignable manuscripts available.
                        {user?.role === 'editor'
                          ? ' You can only invite reviewers to manuscripts assigned to you.'
                          : ' Screen submissions first from the dashboard.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">
                      Review Deadline <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={inviteDeadline}
                        min={minDeadline}
                        onChange={e => setInviteDeadline(e.target.value)}
                        className="form-input pl-9 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={closeInvite} className="btn-outline flex-1 py-2 text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !inviteMs || !inviteDeadline}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {inviteLoading
                      ? <><Loader size={14} className="animate-spin" /> Sending…</>
                      : <><UserPlus size={14} /> Send Invitation</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}