import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Clock, AlertTriangle, BarChart2,
  Filter, Search, UserPlus, BookOpen, Mail, BarChart,
  FileText, X, Calendar, Loader, Send, Users,
  CreditCard, CheckCircle, Download, ShieldCheck, ShieldX
} from 'lucide-react'
import { manuscriptsApi, reviewsApi, usersApi, paymentsApi, archiveApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'


const statusConfig = {
  submitted:           { label: 'NEW SUBMISSION',     cls: 'bg-blue-100 text-blue-800'    },
  desk_rejected:       { label: 'DESK REJECTED',      cls: 'bg-red-200 text-red-900'      },
  editor_assigned:     { label: 'EDITOR ASSIGNED',    cls: 'bg-purple-100 text-purple-800'},
  under_review:        { label: 'IN REVIEW',          cls: 'bg-yellow-100 text-yellow-800'},
  revision_required:   { label: 'REVISION DUE',       cls: 'bg-red-100 text-red-700'      },
  revision_submitted:  { label: 'AWAITING DECISION',  cls: 'bg-green-100 text-green-800'  },
  accepted:            { label: 'ACCEPTED',           cls: 'bg-green-200 text-green-900'  },
  awaiting_payment:    { label: 'AWAITING PAYMENT',   cls: 'bg-amber-100 text-amber-800'  },
  rejected:            { label: 'REJECTED',           cls: 'bg-red-200 text-red-800'      },
  published:           { label: 'PUBLISHED',          cls: 'bg-gray-100 text-gray-600'    },
}

const DECISION_ALLOWED       = ['under_review', 'revision_submitted']
const SEND_TO_REVIEW_ALLOWED = ['editor_assigned', 'revision_submitted']

function StatCard({ label, value, sub, subColor, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {Icon && <Icon size={16} className="text-gray-400" />}
      </div>
      <p className="text-3xl sm:text-4xl font-bold text-navy-900">{value}</p>
      {sub && <p className={`text-xs mt-1.5 font-medium ${subColor || 'text-gray-400'}`}>{sub}</p>}
    </div>
  )
}

export default function EditorInChiefDashboard() {
  const { user } = useAuth()
  const [queue,          setQueue]          = useState([])
  const [reviewers,      setReviewers]      = useState([])
  const [editors,        setEditors]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [searchQ,        setSearchQ]        = useState('')
  const [reviewerSearch, setReviewerSearch] = useState('')
  const [queueFilter,    setQueueFilter]    = useState('all')

  // Pending payments
  const [pendingPayments,   setPendingPayments]   = useState([])
  const [confirmingPayment, setConfirmingPayment] = useState(null)

  const [pendingReviewers, setPendingReviewers] = useState([])
  const [reviewerActionId, setReviewerActionId] = useState(null)

  // Screening modal
  const [screenReason,   setScreenReason]   = useState('')
  const [screenLoading,  setScreenLoading]  = useState(false)
  const [screenError,    setScreenError]    = useState('')

  // Decision modal
  const [decisionModal,      setDecisionModal]      = useState(null)
  const [decision,           setDecision]           = useState('')
  const [decisionNote,       setDecisionNote]       = useState('')
  const [decisionLoading,    setDecisionLoading]    = useState(false)
  const [decisionError,      setDecisionError]      = useState('')
  const [submittedDecisions, setSubmittedDecisions] = useState({})

  // Invite reviewer modal
  const [inviteModal,      setInviteModal]      = useState(null)
  const [inviteManuscript, setInviteManuscript] = useState('')
  const [inviteDeadline,   setInviteDeadline]   = useState('')
  const [inviteLoading,    setInviteLoading]    = useState(false)
  const [inviteError,      setInviteError]      = useState('')
  const [inviteSuccess,    setInviteSuccess]    = useState(false)

  // Assign editor modal
  const [assignModal,    setAssignModal]    = useState(null)
  const [assignEditorId, setAssignEditorId] = useState('')
  const [assigning,      setAssigning]      = useState(false)
  const [assignError,    setAssignError]    = useState('')
  const [assignSuccess,  setAssignSuccess]  = useState(false)

  // Send to review
  const [sendingToReview, setSendingToReview] = useState(null)

  // Publishing
  const [publishing, setPublishing] = useState(null)
  const [confirmedPaymentIds, setConfirmedPaymentIds] = useState(new Set())

  // Add these state variables near the other state declarations
  const [publishModal,   setPublishModal]   = useState(null)  // manuscript object
  const [pubVolumes,     setPubVolumes]     = useState([])
  const [pubIssueId,     setPubIssueId]     = useState('')
  const [pubDoi,         setPubDoi]         = useState('')
  const [pubLoading,     setPubLoading]     = useState(false)
  const [pubError,       setPubError]       = useState('')

  const [screenModal,    setScreenModal]    = useState(null)  // manuscript object
  const [screenDetailLoading, setScreenDetailLoading] = useState(false)
  const [screenDecision, setScreenDecision] = useState('')    // 'accept' | 'decline'

  useEffect(() => {
  Promise.all([
    manuscriptsApi.listAll().catch(() => []),
    usersApi.reviewers().catch(() => []),
    usersApi.editors().catch(() => []),
    paymentsApi.listPending().catch(() => []),
    paymentsApi.listConfirmed().catch(() => []),
    archiveApi.volumes().catch(() => []).then(v => setPubVolumes(v || [])),
    usersApi.pendingReviewers().catch(() => []),
  ]).then(([ms, revs, allEditors, pays, confirmedPays, _vols, pendingRevs]) => {
    setQueue(ms || [])
    setReviewers(revs || [])
    setEditors(allEditors || [])
    setPendingPayments(pays || [])
    const confirmedIds = new Set((confirmedPays || []).map(p => p.manuscript_id))
    setConfirmedPaymentIds(confirmedIds)
    setPendingReviewers(pendingRevs || [])
  }).catch(console.error)
    .finally(() => setLoading(false))
}, [])

  const refreshQueue = async () => {
    const updated = await manuscriptsApi.listAll().catch(() => queue)
    setQueue(updated || queue)
  }

  const filtered = queue.filter(s => {
    const matchSearch =
      !searchQ ||
      s.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.manuscript_id?.toLowerCase().includes(searchQ.toLowerCase())
    const matchFilter = queueFilter === 'all' || s.status === queueFilter
    return matchSearch && matchFilter
  })

  const filteredReviewers = reviewers.filter(r =>
    !reviewerSearch ||
    r.name?.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    r.affiliation?.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    r.expertise_areas?.toLowerCase().includes(reviewerSearch.toLowerCase())
  )

  const assignableManuscripts = queue.filter(s =>
    ['submitted', 'editor_assigned', 'under_review'].includes(s.status) && s.screened_at
  )

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleScreen = async () => {
    if (!screenDecision) { setScreenError('Please choose Accept or Decline.'); return }
    if (screenDecision === 'decline' && !screenReason.trim()) {
      setScreenError('Please provide a reason for declining.')
      return
    }
    setScreenLoading(true)
    setScreenError('')
    try {
      await manuscriptsApi.screenManuscript(screenModal.id, screenDecision, screenReason)
      await refreshQueue()
      closeScreenModal()
    } catch (err) {
      setScreenError(err.message || 'Screening failed. Please try again.')
    } finally {
      setScreenLoading(false)
    }
  }

  const openScreenModal = async (sub) => {
  setScreenModal(sub)
  setScreenDecision('')
  setScreenReason('')
  setScreenError('')
  setScreenDetailLoading(true)
  try {
    const full = await manuscriptsApi.get(sub.id)
    setScreenModal(full)
  } catch (err) {
    setScreenError('Could not load full manuscript details.')
  } finally {
    setScreenDetailLoading(false)
  }
}

const closeScreenModal = () => {
  setScreenModal(null)
  setScreenDecision('')
  setScreenReason('')
  setScreenError('')
  setScreenDetailLoading(false)
}

  const handleDecision = async () => {
    if (!decision) return
    const statusMap = {
      accept: 'accepted',
      minor:  'revision_required',
      major:  'revision_required',
      reject: 'rejected',
    }
    setDecisionLoading(true)
    setDecisionError('')
    try {
      await manuscriptsApi.decision(decisionModal, statusMap[decision], decisionNote)
      setSubmittedDecisions(p => ({ ...p, [decisionModal]: decision }))
      await refreshQueue()
      setDecisionModal(null)
      setDecision('')
      setDecisionNote('')
    } catch (err) {
      setDecisionError(err.message || 'Decision failed.')
    } finally {
      setDecisionLoading(false)
    }
  }

  const handleSendToReview = async (manuscriptId) => {
    setSendingToReview(manuscriptId)
    try {
      await manuscriptsApi.sendToReview(manuscriptId)
      await refreshQueue()
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSendingToReview(null)
    }
  }

  const handleAssignEditor = async () => {
    if (!assignEditorId) { setAssignError('Please select an editor.'); return }
    setAssigning(true)
    setAssignError('')
    try {
      await manuscriptsApi.assignEditor(assignModal.id, parseInt(assignEditorId))
      await refreshQueue()
      setAssignSuccess(true)
    } catch (err) {
      setAssignError(err.message || 'Assignment failed.')
    } finally {
      setAssigning(false)
    }
  }

  const handleInviteReviewer = async () => {
    if (!inviteManuscript) { setInviteError('Please select a manuscript.'); return }
    if (!inviteDeadline)   { setInviteError('Please set a review deadline.'); return }
    setInviteLoading(true)
    setInviteError('')
    try {
      await reviewsApi.inviteReviewer(inviteManuscript, inviteModal.id, inviteDeadline)
      setInviteSuccess(true)
    } catch (err) {
      setInviteError(err.message || 'Invitation failed.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleConfirmPayment = async (manuscriptId, paymentType = 'publication') => {
    setConfirmingPayment(manuscriptId)
    try {
      await paymentsApi.confirm(manuscriptId, paymentType)
      setPendingPayments(prev => prev.filter(p => !(p.manuscript_id === manuscriptId && (p.payment_type || 'publication') === paymentType)))
      if (paymentType === 'publication') {
        setConfirmedPaymentIds(prev => new Set([...prev, manuscriptId]))
      }
      await refreshQueue()
    } catch (err) {
      alert(err.message || 'Failed to confirm payment.')
    } finally {
      setConfirmingPayment(null)
    }
  }

  const handleApproveReviewer = async (userId) => {
  setReviewerActionId(userId)
  try {
    await usersApi.approveReviewer(userId)
    setPendingReviewers(prev => prev.filter(u => u.id !== userId))
    const revs = await usersApi.reviewers().catch(() => reviewers)
    setReviewers(revs || reviewers)
  } catch (err) {
    alert(err.message || 'Failed to approve reviewer.')
  } finally {
    setReviewerActionId(null)
  }
}

const handleRejectReviewer = async (userId) => {
  if (!window.confirm('Reject this reviewer registration? Their account will be deactivated.')) return
  setReviewerActionId(userId)
  try {
    await usersApi.rejectReviewer(userId)
    setPendingReviewers(prev => prev.filter(u => u.id !== userId))
  } catch (err) {
    alert(err.message || 'Failed to reject reviewer.')
  } finally {
    setReviewerActionId(null)
  }
}

  const handlePublish = (manuscript) => {
    setPublishModal(manuscript)
    setPubIssueId('')
    setPubDoi('')
    setPubError('')
  }

  const confirmPublish = async () => {
    setPubLoading(true)
    setPubError('')
    try {
      await manuscriptsApi.publishManuscript(
        publishModal.id,
        pubDoi.trim() || null,
        pubIssueId ? parseInt(pubIssueId) : null
      )
      await refreshQueue()
      setPublishModal(null)
    } catch (err) {
      setPubError(err.message || 'Could not publish. Ensure payment is confirmed first.')
    } finally {
      setPubLoading(false)
    }
  }

  const closeInviteModal = () => {
    setInviteModal(null); setInviteManuscript(''); setInviteDeadline('')
    setInviteError(''); setInviteSuccess(false)
  }
  const closeAssignModal = () => {
    setAssignModal(null); setAssignEditorId('')
    setAssignError(''); setAssignSuccess(false)
  }

  // Stats
  const totalSubmissions = queue.length
  const pendingReviews   = queue.filter(s => s.status === 'under_review').length
  const awaitingDecision = queue.filter(s => s.status === 'revision_submitted').length
  const decided          = queue.filter(s => ['accepted','rejected','published'].includes(s.status)).length
  const accepted         = queue.filter(s => ['accepted','published'].includes(s.status)).length
  const acceptanceRate   = decided > 0 ? Math.round((accepted / decided) * 100) + '%' : '—'

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDeadline = tomorrow.toISOString().split('T')[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Editor-in-Chief Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Full editorial control — screen submissions, assign editors, invite reviewers, make decisions, and confirm payments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="Total Submissions" value={loading ? '—' : totalSubmissions}
          sub={totalSubmissions > 0 ? 'All time' : 'No submissions'} subColor="text-green-600" icon={BarChart2} />
        <StatCard label="Under Review"      value={loading ? '—' : pendingReviews}
          sub={pendingReviews > 0 ? 'Active reviews' : 'None'} subColor="text-orange-600" icon={Clock} />
        <StatCard label="Awaiting Decision" value={loading ? '—' : awaitingDecision}
          sub={awaitingDecision > 0 ? 'Reviews complete' : 'None'} subColor="text-blue-600" icon={TrendingUp} />
        <StatCard label="Acceptance Rate"   value={loading ? '—' : acceptanceRate}
          sub={decided > 0 ? `${decided} decisions` : 'No decisions'} subColor="text-gray-500" icon={BarChart} />
      </div>

      {/* ── Pending Reviewer Registrations ────────────────────────────────── */}
      {pendingReviewers.length > 0 && (
        <div className="card p-5 mb-6 border-blue-200 bg-blue-50/40">
          <h2 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
            <UserPlus size={15} className="text-blue-600" />
            Pending Reviewer Registrations
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">
              {pendingReviewers.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            New reviewers awaiting vetting. Approve to let them log in and be invited to review manuscripts.
          </p>
          <div className="space-y-3">
            {pendingReviewers.map(rev => (
              <div key={rev.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-blue-200">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{rev.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {rev.email}{rev.affiliation ? ` · ${rev.affiliation}` : ''}
                  </p>
                  {rev.expertise_areas && (
                    <p className="text-xs text-gray-400 truncate">{rev.expertise_areas}</p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRejectReviewer(rev.id)}
                    disabled={reviewerActionId === rev.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold disabled:opacity-50"
                  >
                    <ShieldX size={12} /> Reject
                  </button>
                  <button
                    onClick={() => handleApproveReviewer(rev.id)}
                    disabled={reviewerActionId === rev.id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    {reviewerActionId === rev.id
                      ? <Loader size={12} className="animate-spin" />
                      : <ShieldCheck size={12} />
                    }
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending Payment Confirmations ─────────────────────────────────── */}
      {pendingPayments.length > 0 && (
        <div className="card p-5 mb-6 border-amber-200 bg-amber-50/40">
          <h2 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
            <CreditCard size={15} className="text-amber-600" />
            Pending Payment Confirmations
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full ml-1">
              {pendingPayments.length}
            </span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Authors have uploaded payment proof. View the receipt and confirm to unlock publishing.
          </p>
          <div className="space-y-3">
            {pendingPayments.map(pay => (
              <div key={pay.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-amber-200">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {pay.manuscript?.title || `Manuscript #${pay.manuscript_id}`}
                    </p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      (pay.payment_type || 'publication') === 'assessment'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {(pay.payment_type || 'publication') === 'assessment' ? 'Assessment Fee' : 'Publication Fee'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {pay.currency} {Number(pay.amount || 0).toLocaleString()} · Proof uploaded{' '}
                    {pay.proof_uploaded_at
                      ? new Date(pay.proof_uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {pay.proof_file_path && (
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('access_token')
                          const base  = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
                          const res   = await fetch(
                            `${base}/payments/manuscript/${pay.manuscript_id}/proof?payment_type=${pay.payment_type || 'publication'}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          )
                          if (!res.ok) throw new Error('Failed to load receipt')
                          const blob = await res.blob()
                          const url  = URL.createObjectURL(blob)
                          window.open(url, '_blank')
                        } catch (err) {
                          alert('Could not load receipt: ' + err.message)
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
                    >
                      <Download size={12} /> View Receipt
                    </button>
                  )}
                  <button
                    onClick={() => handleConfirmPayment(pay.manuscript_id, pay.payment_type || 'publication')}
                    disabled={confirmingPayment === pay.manuscript_id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    {confirmingPayment === pay.manuscript_id
                      ? <Loader size={12} className="animate-spin" />
                      : <CheckCircle size={12} />
                    }
                    Confirm Payment
                  </button>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {pay.proof_file_path && (
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('access_token')
                          const base  = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
                          const res   = await fetch(
                            `${base}/payments/manuscript/${pay.manuscript_id}/proof`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          )
                          if (!res.ok) throw new Error('Failed to load receipt')
                          const blob = await res.blob()
                          const url  = URL.createObjectURL(blob)
                          window.open(url, '_blank')
                        } catch (err) {
                          alert('Could not load receipt: ' + err.message)
                        }
                      }}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold"
                    >
                      <Download size={12} /> View Receipt
                    </button>
                  )}
                  <button
                    onClick={() => handleConfirmPayment(pay.manuscript_id)}
                    disabled={confirmingPayment === pay.manuscript_id}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold disabled:opacity-50"
                  >
                    {confirmingPayment === pay.manuscript_id
                      ? <Loader size={12} className="animate-spin" />
                      : <CheckCircle size={12} />
                    }
                    Confirm Payment
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Submission Queue */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy-900">Submission Queue</h2>
              <div className="relative hidden sm:block">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search…"
                  className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-navy-600 w-36" />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-4 sm:px-5">
              {[
                { key: 'all',                label: 'All'               },
                { key: 'submitted',          label: 'New'               },
                { key: 'editor_assigned',    label: 'Assigned'          },
                { key: 'under_review',       label: 'Under Review'      },
                { key: 'revision_submitted', label: 'Awaiting Decision' },
                { key: 'accepted',           label: 'Accepted'          },
              ].map(f => (
                <button key={f.key} onClick={() => setQueueFilter(f.key)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
                    queueFilter === f.key
                      ? 'border-navy-900 text-navy-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {f.label}
                  <span className="ml-1 text-gray-400">
                    ({queue.filter(s => f.key === 'all' || s.status === f.key).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="divide-y divide-gray-50">
              {loading ? (
                <p className="text-center py-10 text-gray-400 text-sm">Loading…</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No submissions in this category.</p>
                </div>
              ) : filtered.map(sub => {
                const stCfg = statusConfig[sub.status] || { label: sub.status, cls: 'bg-gray-100 text-gray-600' }
                const localDecision    = submittedDecisions[sub.id]
                const canDecide        = DECISION_ALLOWED.includes(sub.status) && !localDecision
                const canSendToReview  = SEND_TO_REVIEW_ALLOWED.includes(sub.status) && !localDecision
                const needsScreening   = sub.status === 'submitted' && !sub.screened_at
                const canAssignEditor  = sub.status === 'submitted' && sub.screened_at && !localDecision
                const canPublish = sub.status === 'accepted' && confirmedPaymentIds.has(sub.id)
                const isSending        = sendingToReview === sub.id
                const isPublishing     = publishing === sub.id

                return (
                  <div key={sub.id} className="px-4 sm:px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400 font-medium">#{sub.manuscript_id}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide ml-auto ${
                        localDecision ? 'bg-purple-100 text-purple-800' : stCfg.cls
                      }`}>
                        {localDecision ? `DECISION: ${localDecision.toUpperCase()}` : stCfg.label}
                      </span>
                      {needsScreening && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                          NEEDS SCREENING
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-navy-900 text-sm sm:text-base leading-snug mb-1">
                      {sub.title}
                    </h3>

                    {sub.editor_id && (
                      <p className="text-xs text-gray-400 mb-1">
                        Assigned to:{' '}
                        <span className="font-medium text-gray-600">
                          {editors.find(e => e.id === sub.editor_id)?.name || `Editor #${sub.editor_id}`}
                        </span>
                      </p>
                    )}

                    <p className="text-xs text-gray-500 mb-3">
                      {sub.submitted_at
                        ? `Submitted: ${new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Not yet submitted'}
                    </p>

                    <div className="flex flex-wrap gap-2">

                      {/* Screen Manuscript — for new unscreened submissions */}
                      {needsScreening && (
                        <button
                          onClick={() => openScreenModal(sub)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 font-semibold border border-amber-300 transition-colors"
                        >
                          <ShieldCheck size={12} /> Screen Submission
                        </button>
                      )}

                      {/* Assign to Editor — only after screening */}
                      {canAssignEditor && (
                        <button
                          onClick={() => { setAssignModal(sub); setAssignEditorId(''); setAssignError(''); setAssignSuccess(false) }}
                          className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
                        >
                          <Users size={11} /> Assign Editor
                        </button>
                      )}

                      {/* Send to Review */}
                      {canSendToReview && (
                        <button onClick={() => handleSendToReview(sub.id)} disabled={isSending}
                          className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50">
                          {isSending
                            ? <><Loader size={11} className="animate-spin" /> Sending…</>
                            : <><Send size={11} /> Send to Review</>
                          }
                        </button>
                      )}

                      {/* Make Decision */}
                      {canDecide && (
                        <button onClick={() => { setDecisionModal(sub.id); setDecisionError('') }}
                          className="btn-outline text-xs py-1.5 px-3">
                          Make Decision
                        </button>
                      )}

                      {/* Publish — for accepted manuscripts */}
                      {canPublish && (
                        <button
                          onClick={() => handlePublish(sub)}
                          disabled={isPublishing}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 font-semibold disabled:opacity-50"
                        >
                          {isPublishing
                            ? <><Loader size={11} className="animate-spin" /> Publishing…</>
                            : <><BookOpen size={11} /> Publish</>
                          }
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 sm:space-y-5">

          {/* Invite Reviewer */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-0.5">Invite Reviewer</h2>
            <p className="text-xs text-gray-500 mb-4">Search and invite reviewers to manuscripts.</p>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)}
                placeholder="Search reviewers…" className="form-input pl-8 text-sm" />
            </div>
            <div className="space-y-2">
              {filteredReviewers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No reviewers found.</p>
              ) : filteredReviewers.slice(0, 4).map(rev => (
                <div key={rev.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900">{rev.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {rev.affiliation}
                      {rev.expertise_areas ? ` · ${rev.expertise_areas}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => { setInviteModal(rev); setInviteError(''); setInviteSuccess(false) }}
                    className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-md transition-colors flex-shrink-0 ml-2"
                    title={`Invite ${rev.name}`}>
                    <UserPlus size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial Team */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-0.5 flex items-center gap-2">
              Editorial Team
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {editors.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">All registered editors and editors-in-chief.</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {editors.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-3">No editors registered yet.</p>
              ) : editors.map(ed => (
                <div key={ed.id}
                  className="flex items-start justify-between p-3 rounded-lg border border-gray-100">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">
                      {ed.name}{ed.id === user?.id ? ' (You)' : ''}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{ed.email}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                    ed.role === 'editor_in_chief' ? 'bg-navy-100 text-navy-800' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {ed.role === 'editor_in_chief' ? 'EiC' : 'Editor'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Quick Links</h2>
            <div className="space-y-2">
              {[
                { to: '/dashboard/editor_in_chief/queue',     icon: FileText,  color: 'text-blue-600',   label: 'Full Queue',         sub: 'All active submissions' },
                { to: '/dashboard/editor_in_chief/reviewers', icon: Users,     color: 'text-green-600',  label: 'Reviewer Directory',  sub: 'Browse all reviewers'  },
                { to: '/dashboard/editor_in_chief/metrics',   icon: BarChart2, color: 'text-purple-600', label: 'Metrics',             sub: 'Submissions and trends' },
                { to: '/dashboard/author/submit',             icon: BookOpen,  color: 'text-orange-600', label: 'Submit Manuscript',   sub: 'Submit your own work'  },
              ].map(({ to, icon: Icon, color, label, sub }) => (
                <Link key={to} to={to}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <Icon size={15} className={color} />
                  <div>
                    <p className="font-medium text-sm text-gray-700">{label}</p>
                    <p className="text-xs text-gray-400">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Screening Modal ───────────────────────────────────────────────── */}
      {screenModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Initial Screening</h3>
              <button onClick={closeScreenModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Manuscript preview */}
            <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                {screenModal.manuscript_id} · {screenModal.article_type}
              </p>
              <p className="font-semibold text-navy-900 text-sm leading-snug">{screenModal.title}</p>

              {screenDetailLoading ? (
                <p className="text-xs text-gray-400 flex items-center gap-1.5 pt-1">
                  <Loader size={11} className="animate-spin" /> Loading full details…
                </p>
              ) : (
                <>
                  {screenModal.abstract && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Abstract</p>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{screenModal.abstract}</p>
                    </div>
                  )}
                  {screenModal.keywords && (
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-600">Keywords: </span>{screenModal.keywords}
                    </p>
                  )}
                  {screenModal.subject_area && (
                    <p className="text-xs text-gray-500">
                      <span className="font-semibold text-gray-600">Subject: </span>{screenModal.subject_area}
                    </p>
                  )}
                  {screenModal.co_authors?.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Authors</p>
                      <ul className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                        {screenModal.co_authors.map((a, i) => (
                          <li key={i}>
                            {a.name}{a.is_corresponding ? ' (Corresponding)' : ''}
                            {a.affiliation ? ` — ${a.affiliation}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {screenModal.cover_letter && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover Letter</p>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5 whitespace-pre-line">
                        {screenModal.cover_letter}
                      </p>
                    </div>
                  )}
                  {screenModal.files?.length > 0 && (
                    <div className="pt-1">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Files</p>
                      <ul className="text-xs mt-0.5 space-y-1">
                        {screenModal.files.map(f => (
                          <li key={f.id}>
                            <button
                              type="button"
                              onClick={() => manuscriptsApi.downloadFile(screenModal.id, f.id, f.filename)}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Download size={11} /> {f.filename}
                              <span className="text-gray-400">
                                ({f.file_type}{f.file_size ? `, ${Math.round(f.file_size / 1024)} KB` : ''})
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Does this submission meet the journal's scope and formatting requirements
              to proceed to peer review?
            </p>

            {/* Decision buttons */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={() => setScreenDecision('accept')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                  screenDecision === 'accept'
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-green-400 hover:text-green-700'
                }`}
              >
                <ShieldCheck size={15} /> Accept for Review
              </button>
              <button
                onClick={() => setScreenDecision('decline')}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-semibold transition-colors ${
                  screenDecision === 'decline'
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-700'
                }`}
              >
                <ShieldX size={15} /> Desk Reject
              </button>
            </div>

            {/* Reason — required for decline */}
            {screenDecision === 'decline' && (
              <div className="mb-4">
                <label className="form-label">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={screenReason}
                  onChange={e => setScreenReason(e.target.value)}
                  rows={4}
                  placeholder="This will be sent to the author by email. Be specific and constructive…"
                  className="form-input text-sm resize-none w-full"
                />
              </div>
            )}

            {screenDecision === 'accept' && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-xs text-green-700 leading-relaxed">
                  The submission will be marked as passed screening. You can then assign it
                  to an editor or directly invite reviewers from the queue.
                </p>
              </div>
            )}

            {screenError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {screenError}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={closeScreenModal} className="btn-outline flex-1 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={handleScreen}
                disabled={screenLoading || !screenDecision}
                className={`flex-1 py-2 text-sm rounded-lg font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-colors ${
                  screenDecision === 'decline' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {screenLoading
                  ? <><Loader size={14} className="animate-spin" /> Processing…</>
                  : screenDecision === 'decline' ? 'Confirm Desk Rejection' : 'Confirm Acceptance'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Assign Editor Modal ───────────────────────────────────────────── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Assign Editor</h3>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {assignSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users size={22} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Editor Assigned!</p>
                <p className="text-sm text-gray-500 mb-4">The manuscript has been assigned successfully.</p>
                <button onClick={closeAssignModal} className="btn-primary text-sm py-2 px-6">Done</button>
              </div>
            ) : (
              <>
                <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                  <p className="font-medium text-gray-700 truncate">{assignModal.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">#{assignModal.manuscript_id}</p>
                </div>
                {assignError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {assignError}
                  </div>
                )}
                <div className="mb-5">
                  <label className="form-label">Select Editor <span className="text-red-500">*</span></label>
                  <select value={assignEditorId} onChange={e => setAssignEditorId(e.target.value)}
                    className="form-input text-sm">
                    <option value="">Choose an editor…</option>
                    <option value={String(user?.id)}>Myself ({user?.name})</option>
                    {editors.filter(e => e.id !== user?.id).map(e => (
                      <option key={e.id} value={String(e.id)}>
                        {e.name} — {e.role === 'editor_in_chief' ? 'Editor-in-Chief' : 'Editor'}
                      </option>
                    ))}
                  </select>
                  {editors.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No other editors found. Invite editors via Admin → User Management.
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={closeAssignModal} className="btn-outline flex-1 py-2 text-sm">Cancel</button>
                  <button onClick={handleAssignEditor} disabled={assigning || !assignEditorId}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    {assigning
                      ? <><Loader size={14} className="animate-spin" /> Assigning…</>
                      : <><Users size={14} /> Assign</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Invite Reviewer Modal ─────────────────────────────────────────── */}
      {inviteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Invite Reviewer</h3>
              <button onClick={closeInviteModal} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus size={22} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Invitation sent!</p>
                <p className="text-sm text-gray-500 mb-4">
                  {inviteModal.name} has been invited to review the selected manuscript.
                </p>
                <button onClick={closeInviteModal} className="btn-primary text-sm py-2 px-6">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
                  <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {inviteModal.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{inviteModal.name}</p>
                    <p className="text-xs text-gray-500">{inviteModal.affiliation}</p>
                  </div>
                </div>

                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {inviteError}
                  </div>
                )}

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="form-label">Select Manuscript <span className="text-red-500">*</span></label>
                    <select value={inviteManuscript} onChange={e => setInviteManuscript(e.target.value)}
                      className="form-input text-sm">
                      <option value="">Choose a manuscript…</option>
                      {assignableManuscripts.map(ms => (
                        <option key={ms.id} value={ms.id}>
                          {ms.manuscript_id} — {ms.title?.length > 50 ? ms.title.slice(0, 50) + '…' : ms.title}
                        </option>
                      ))}
                    </select>
                    {assignableManuscripts.length === 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        No screened manuscripts available. Screen submissions first.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="form-label">Review Deadline <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="date" value={inviteDeadline} min={minDeadline}
                        onChange={e => setInviteDeadline(e.target.value)}
                        className="form-input pl-9 text-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={closeInviteModal} className="btn-outline flex-1 py-2 text-sm">Cancel</button>
                  <button onClick={handleInviteReviewer}
                    disabled={inviteLoading || !inviteManuscript || !inviteDeadline}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
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

      {/* ── Decision Modal ────────────────────────────────────────────────── */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-navy-900">Editorial Decision</h3>
              <button onClick={() => { setDecisionModal(null); setDecision(''); setDecisionError('') }}
                className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Manuscript:{' '}
              <span className="font-medium text-navy-900">
                {queue.find(s => s.id === decisionModal)?.manuscript_id}
              </span>
            </p>

            {decisionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {decisionError}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {[
                { value: 'accept', label: 'Accept',                 cls: 'border-green-300 bg-green-50 text-green-800'    },
                { value: 'minor',  label: 'Minor Revision Required', cls: 'border-blue-300 bg-blue-50 text-blue-800'       },
                { value: 'major',  label: 'Major Revision Required', cls: 'border-orange-300 bg-orange-50 text-orange-800' },
                { value: 'reject', label: 'Reject',                  cls: 'border-red-300 bg-red-50 text-red-800'          },
              ].map(d => (
                <label key={d.value}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    decision === d.value ? d.cls : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}>
                  <input type="radio" name="decision" value={d.value}
                    checked={decision === d.value} onChange={() => setDecision(d.value)}
                    className="text-navy-700" />
                  <span className="font-medium text-sm">{d.label}</span>
                </label>
              ))}
            </div>

            <div className="mb-5">
              <label className="form-label">Decision Letter / Notes</label>
              <textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)} rows={3}
                placeholder="Add notes for the authors…"
                className="form-input text-sm resize-y" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setDecisionModal(null); setDecision(''); setDecisionError('') }}
                className="btn-outline flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleDecision} disabled={!decision || decisionLoading}
                className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {decisionLoading
                  ? <><Loader size={14} className="animate-spin" /> Saving…</>
                  : 'Confirm Decision'
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Publish Modal ─────────────────────────────────────────────────── */}
      {publishModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-navy-900">Publish Manuscript</h3>
              <button onClick={() => setPublishModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{publishModal.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">#{publishModal.manuscript_id}</p>
            </div>

            {pubError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {pubError}
              </div>
            )}

            <div className="space-y-4 mb-5">
              <div>
                <label className="form-label">
                  Assign to Issue <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <select
                  value={pubIssueId}
                  onChange={e => setPubIssueId(e.target.value)}
                  className="form-input text-sm"
                >
                  <option value="">No issue assignment</option>
                  {pubVolumes.flatMap(vol =>
                    (vol.issues || []).map(iss => (
                      <option key={iss.id} value={iss.id}>
                        Vol. {vol.volume_number} ({vol.year}) — Issue {iss.issue_number}
                        {iss.period ? ` · ${iss.period}` : ''}
                      </option>
                    ))
                  )}
                </select>
                {pubVolumes.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    No volumes yet. Go to Admin → Volumes &amp; Issues to create one first.
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">
                  DOI <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={pubDoi}
                  onChange={e => setPubDoi(e.target.value)}
                  placeholder="e.g. 10.12345/jcas.2026.001"
                  className="form-input text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPublishModal(null)} className="btn-outline flex-1 py-2 text-sm">
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={pubLoading}
                className="flex-1 py-2 text-sm rounded-lg font-semibold text-white bg-green-700 hover:bg-green-800 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {pubLoading
                  ? <><Loader size={14} className="animate-spin" /> Publishing…</>
                  : <><BookOpen size={14} /> Confirm &amp; Publish</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}