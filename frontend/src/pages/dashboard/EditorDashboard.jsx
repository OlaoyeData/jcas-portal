import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp, Clock, AlertTriangle, BarChart2,
  Filter, Search, UserPlus, BookOpen, Mail, BarChart,
  FileText, X, Calendar, Loader, Send, Users
} from 'lucide-react'
import { manuscriptsApi, reviewsApi, usersApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const statusConfig = {
  submitted:           { label: 'NEW SUBMISSION',    cls: 'bg-blue-100 text-blue-800'    },
  editor_assigned:     { label: 'AWAITING REVIEWERS',cls: 'bg-yellow-100 text-yellow-800'},
  under_review:        { label: 'IN REVIEW',         cls: 'bg-blue-100 text-blue-800'    },
  revision_required:   { label: 'REVISION DUE',      cls: 'bg-red-100 text-red-700'      },
  revision_submitted:  { label: 'AWAITING DECISION', cls: 'bg-green-100 text-green-800'  },
  accepted:            { label: 'ACCEPTED',          cls: 'bg-green-200 text-green-900'  },
  rejected:            { label: 'REJECTED',          cls: 'bg-red-200 text-red-800'      },
  published:           { label: 'PUBLISHED',         cls: 'bg-gray-100 text-gray-600'    },
}

// Statuses where a decision is allowed
const DECISION_ALLOWED = ['under_review', 'revision_submitted']
// Statuses where "Send to Review" makes sense
const SEND_TO_REVIEW_ALLOWED = ['editor_assigned']

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

export default function EditorDashboard() {
  const [queue,              setQueue]              = useState([])
  const [reviewers,          setReviewers]          = useState([])
  const [loading,            setLoading]            = useState(true)
  const [searchQ,            setSearchQ]            = useState('')
  const [reviewerSearch,     setReviewerSearch]     = useState('')
  const [queueFilter,        setQueueFilter]        = useState('all')
  const [filterOpen,         setFilterOpen]         = useState(false)
  const [submittedDecisions, setSubmittedDecisions] = useState({})
  const [emailModal,         setEmailModal]         = useState(false)

  // Decision modal
  const [decisionModal, setDecisionModal] = useState(null)  // manuscript id
  const [decision,      setDecision]      = useState('')
  const [decisionNote,  setDecisionNote]  = useState('')
  const [decisionLoading, setDecisionLoading] = useState(false)
  const [decisionError,   setDecisionError]   = useState('')

  // Invite modal
  const [inviteModal,      setInviteModal]      = useState(null)  // reviewer object
  const [inviteManuscript, setInviteManuscript] = useState('')    // manuscript id
  const [inviteDeadline,   setInviteDeadline]   = useState('')
  const [inviteLoading,    setInviteLoading]    = useState(false)
  const [inviteError,      setInviteError]      = useState('')
  const [inviteSuccess,    setInviteSuccess]    = useState(false)

  // Send to review loading state
  const [sendingToReview, setSendingToReview] = useState(null) 
  

  const { user } = useAuth()
  const [assigningEditor, setAssigningEditor] = useState(null)

  const handleAssignToMe = async (manuscriptId) => {
    setAssigningEditor(manuscriptId)
    try {
      await manuscriptsApi.assignEditor(manuscriptId, user.id)
      const updated = await manuscriptsApi.listAll().catch(() => queue)
      setQueue(updated || queue)
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setAssigningEditor(null)
    }
  }

  useEffect(() => {
    Promise.all([
      manuscriptsApi.listAll().catch(() => []),
      usersApi.reviewers().catch(() => []),
    ]).then(([ms, revs]) => {
      // Regular editors only see manuscripts assigned to them
      const assigned = (ms || []).filter(m =>
        m.editor_id === user?.id || m.status === 'submitted'
      )
      setQueue(assigned)
      setReviewers(revs || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [user?.id])

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

  // Manuscripts eligible for reviewer assignment
  const assignableManuscripts = queue.filter(s =>
    ['submitted', 'editor_assigned', 'under_review'].includes(s.status)
  )

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
      const updated = await manuscriptsApi.listAll().catch(() => queue)
      setQueue(updated || queue)
      setDecisionModal(null)
      setDecision('')
      setDecisionNote('')
    } catch (err) {
      setDecisionError(err.message || 'Decision failed. Please try again.')
    } finally {
      setDecisionLoading(false)
    }
  }

  const handleSendToReview = async (manuscriptId) => {
    setSendingToReview(manuscriptId)
    try {
      await manuscriptsApi.sendToReview(manuscriptId)
      const updated = await manuscriptsApi.listAll().catch(() => queue)
      setQueue(updated || queue)
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSendingToReview(null)
    }
  }

  const handleInvite = async () => {
    if (!inviteManuscript) { setInviteError('Please select a manuscript.'); return }
    if (!inviteDeadline)   { setInviteError('Please set a review deadline.'); return }
    setInviteLoading(true)
    setInviteError('')
    try {
      await reviewsApi.inviteReviewer(inviteManuscript, inviteModal.id, inviteDeadline)
      setInviteSuccess(true)
    } catch (err) {
      setInviteError(err.message || 'Invitation failed. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const closeInviteModal = () => {
    setInviteModal(null)
    setInviteManuscript('')
    setInviteDeadline('')
    setInviteError('')
    setInviteSuccess(false)
  }

  // Stats
  const totalSubmissions = queue.length
  const pendingReviews   = queue.filter(s => s.status === 'under_review').length
  const awaitingDecision = queue.filter(s => s.status === 'revision_submitted').length
  const decided          = queue.filter(s => ['accepted', 'rejected', 'published'].includes(s.status)).length
  const accepted         = queue.filter(s => ['accepted', 'published'].includes(s.status)).length
  const acceptanceRate   = decided > 0 ? Math.round((accepted / decided) * 100) + '%' : '—'

  // Min date for deadline picker (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDeadline = tomorrow.toISOString().split('T')[0]

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Editor Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your assigned manuscripts, invite reviewers, and record editorial decisions.</p>
      </div>

      {/* Stats — Total Submissions is EiC-only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="My Assignments" value={loading ? '—' : queue.filter(s => s.editor_id === user?.id).length}
          sub="Manuscripts assigned to me" subColor="text-navy-600" icon={FileText} />
        <StatCard label="Under Review" value={loading ? '—' : pendingReviews}
          sub={pendingReviews > 0 ? 'Awaiting reviewer feedback' : 'None active'} subColor="text-orange-600" icon={Clock} />
        <StatCard label="Awaiting Decision" value={loading ? '—' : awaitingDecision}
          sub={awaitingDecision > 0 ? 'Reviews complete' : 'None pending'} subColor="text-blue-600" icon={TrendingUp} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Submission Queue */}
        <div className="lg:col-span-2">
          <div className="card">

            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy-900">Submission Queue</h2>
              <div className="flex items-center gap-2">
                <div className="relative hidden sm:block">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    placeholder="Search…"
                    className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-navy-600 w-36" />
                </div>
                <button onClick={() => setFilterOpen(!filterOpen)}
                  className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors">
                  <Filter size={13} /> Filter
                </button>
              </div>
            </div>

            <div className="sm:hidden px-4 py-2 border-b border-gray-100">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search submissions…"
                  className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-navy-600" />
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-4 sm:px-5">
              {[
                { key: 'all',                label: 'All'                },
                { key: 'submitted',          label: 'New'                },
                { key: 'editor_assigned',    label: 'Awaiting Reviewers' },
                { key: 'under_review',       label: 'Under Review'       },
                { key: 'revision_submitted', label: 'Awaiting Decision'  },
                { key: 'revision_required',  label: 'Revision Due'       },
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

            {/* Queue list */}
            <div className="divide-y divide-gray-50">
              {loading ? (
                <p className="text-center py-10 text-gray-400 text-sm">Loading…</p>
              ) : filtered.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 text-sm">No submissions in this category.</p>
                </div>
              ) : (
                filtered.map(sub => {
                  const stCfg   = statusConfig[sub.status] ||
                    { label: sub.status?.replace(/_/g, ' ').toUpperCase(), cls: 'bg-gray-100 text-gray-600' }
                  const decided = submittedDecisions[sub.id]
                  const canDecide       = DECISION_ALLOWED.includes(sub.status) && !decided
                  const canSendToReview = SEND_TO_REVIEW_ALLOWED.includes(sub.status) && !decided
                  const isSending       = sendingToReview === sub.id

                  return (
                    <div key={sub.id} className="px-4 sm:px-5 py-4 sm:py-5">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs text-gray-400 font-medium">#{sub.manuscript_id}</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide ml-auto ${
                          decided ? 'bg-purple-100 text-purple-800' : stCfg.cls
                        }`}>
                          {decided ? `DECISION: ${decided.toUpperCase()}` : stCfg.label}
                        </span>
                      </div>

                      <Link to={`/dashboard/editor/submission/${sub.id}`}>
                        <h3 className="font-bold text-navy-900 text-sm sm:text-base leading-snug mb-1 hover:text-blue-700 transition-colors">
                          {sub.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-gray-500 mb-3">
                        {sub.submitted_at
                          ? `Submitted: ${new Date(sub.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}`
                          : 'Not yet submitted'}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <Link to={`/dashboard/editor/submission/${sub.id}`} className="btn-primary text-xs py-1.5 px-3">
                          Manage
                        </Link>

                        {/* Send to Review — only for submitted/editor_assigned */}
                        {canSendToReview && (
                          <button
                            onClick={() => handleSendToReview(sub.id)}
                            disabled={isSending}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isSending
                              ? <><Loader size={11} className="animate-spin" /> Sending…</>
                              : <><Send size={11} /> Send to Review</>
                            }
                          </button>
                        )}

                        {/* Make Decision — only for under_review/revision_submitted */}
                        {canDecide && (
                          <button
                            onClick={() => { setDecisionModal(sub.id); setDecisionError('') }}
                            className="btn-outline text-xs py-1.5 px-3"
                          >
                            Make Decision
                          </button>
                        )}

                        {/* Assign to Me — only for submitted manuscripts */}
                        {sub.status === 'submitted' && !decided && (
                          <button
                            onClick={() => handleAssignToMe(sub.id)}
                            disabled={assigningEditor === sub.id}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {assigningEditor === sub.id
                              ? <><Loader size={11} className="animate-spin" /> Assigning…</>
                              : <><UserPlus size={11} /> Assign to Me</>
                            }
                          </button>
                        )}

                        {/* Send to Review — only for editor_assigned */}
                        {canSendToReview && (
                          <button
                            onClick={() => handleSendToReview(sub.id)}
                            disabled={isSending}
                            className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {isSending
                              ? <><Loader size={11} className="animate-spin" /> Sending…</>
                              : <><Send size={11} /> Send to Review</>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 sm:space-y-5">

          {/* Reviewer Assignment */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-0.5">Reviewer Assignment</h2>
            <p className="text-xs text-gray-500 mb-4">Search reviewers to invite to a manuscript.</p>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)}
                placeholder="Search by name or expertise" className="form-input pl-8 text-sm" />
            </div>
            <div className="space-y-2">
              {filteredReviewers.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">
                  {reviewers.length === 0 ? 'No reviewers registered yet.' : 'No reviewers match your search.'}
                </p>
              ) : (
                filteredReviewers.slice(0, 4).map(rev => (
                  <div key={rev.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{rev.name}</p>
                      <p className="text-xs text-gray-500">
                        {rev.affiliation}
                        {rev.expertise_areas ? ` · ${rev.expertise_areas}` : ''}
                      </p>
                      <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        Available
                      </span>
                    </div>
                    {/* Fixed: now opens invite modal instead of navigating */}
                    <button
                      onClick={() => { setInviteModal(rev); setInviteError(''); setInviteSuccess(false) }}
                      className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-md transition-colors flex-shrink-0 ml-2"
                      title={`Invite ${rev.name} to review a manuscript`}
                    >
                      <UserPlus size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
            {filteredReviewers.length > 4 && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                +{filteredReviewers.length - 4} more reviewers
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/dashboard/editor/queue"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                <FileText size={15} className="text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-700">My Submissions Queue</p>
                  <p className="text-xs text-gray-400">Browse your assigned manuscripts</p>
                </div>
              </Link>
              <Link to="/dashboard/author/submit"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                <BookOpen size={15} className="text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-700">Submit Manuscript</p>
                  <p className="text-xs text-gray-400">Submit your own research</p>
                </div>
              </Link>
              <button onClick={() => setEmailModal(true)}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                <Mail size={15} className="text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-700">Email All Reviewers</p>
                  <p className="text-xs text-gray-400">Send a broadcast message</p>
                </div>
              </button>
              <Link to="/dashboard/editor/metrics"
                className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-left">
                <BarChart2 size={15} className="text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-700">View Metrics</p>
                  <p className="text-xs text-gray-400">Submissions, decisions, and trends</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Decisions */}
          <div className="card p-5">
            <h2 className="font-bold text-navy-900 mb-4">Recent Decisions</h2>
            {Object.keys(submittedDecisions).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">No decisions made yet in this session.</p>
            ) : (
              <div className="space-y-3 text-sm">
                {Object.entries(submittedDecisions).map(([id, dec]) => {
                  const ms = queue.find(s => s.id === id)
                  return (
                    <div key={id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-700 truncate text-xs">{ms?.manuscript_id || `#${id}`}</p>
                        <p className="text-xs text-gray-400">This session</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ${
                        dec === 'accept' ? 'bg-green-100 text-green-700' :
                        dec === 'minor'  ? 'bg-blue-100 text-blue-700'   :
                        dec === 'major'  ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {dec === 'accept' ? 'Accepted' : dec === 'minor' ? 'Minor Rev.' : dec === 'major' ? 'Major Rev.' : 'Rejected'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Invite Reviewer Modal ─────────────────────────────────────── */}
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
                {/* Reviewer info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-5">
                  <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                    {inviteModal.name?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{inviteModal.name}</p>
                    <p className="text-xs text-gray-500">{inviteModal.affiliation}</p>
                    {inviteModal.expertise_areas && (
                      <p className="text-xs text-blue-600 mt-0.5">{inviteModal.expertise_areas}</p>
                    )}
                  </div>
                </div>

                {inviteError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {inviteError}
                  </div>
                )}

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="form-label">Select Manuscript <span className="text-red-500">*</span></label>
                    <select
                      value={inviteManuscript}
                      onChange={e => setInviteManuscript(e.target.value)}
                      className="form-input text-sm"
                    >
                      <option value="">Choose a manuscript…</option>
                      {assignableManuscripts.map(ms => (
                        <option key={ms.id} value={ms.id}>
                          {ms.manuscript_id} — {ms.title.length > 50 ? ms.title.slice(0, 50) + '…' : ms.title}
                        </option>
                      ))}
                    </select>
                    {assignableManuscripts.length === 0 && (
                      <p className="text-xs text-gray-400 mt-1">No manuscripts currently available for reviewer assignment.</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Review Deadline <span className="text-red-500">*</span></label>
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
                  <button onClick={closeInviteModal} className="btn-outline flex-1 py-2 text-sm">Cancel</button>
                  <button
                    onClick={handleInvite}
                    disabled={inviteLoading || !inviteManuscript || !inviteDeadline}
                    className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* ── Decision Modal ────────────────────────────────────────────── */}
      {decisionModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-navy-900">Editorial Decision</h3>
              <button onClick={() => { setDecisionModal(null); setDecision(''); setDecisionError('') }}
                className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Manuscript: <span className="font-medium text-navy-900">
                {queue.find(s => s.id === decisionModal)?.manuscript_id}
              </span>
            </p>

            {decisionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {decisionError}
              </div>
            )}

            <div className="space-y-2 mb-4">
              {[
                { value: 'accept', label: 'Accept',                 cls: 'border-green-300 bg-green-50 text-green-800'    },
                { value: 'minor',  label: 'Minor Revision Required', cls: 'border-blue-300 bg-blue-50 text-blue-800'      },
                { value: 'major',  label: 'Major Revision Required', cls: 'border-orange-300 bg-orange-50 text-orange-800'},
                { value: 'reject', label: 'Reject',                  cls: 'border-red-300 bg-red-50 text-red-800'         },
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
                placeholder="Add notes for the decision letter to the authors…"
                className="form-input text-sm resize-y" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setDecisionModal(null); setDecision(''); setDecisionError('') }}
                className="btn-outline flex-1 py-2 text-sm">Cancel</button>
              <button onClick={handleDecision} disabled={!decision || decisionLoading}
                className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {decisionLoading ? <><Loader size={14} className="animate-spin" /> Saving…</> : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Reviewers Modal ─────────────────────────────────────── */}
      {emailModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-navy-900">Email All Reviewers</h3>
              <button onClick={() => setEmailModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              This will send a broadcast email to all {reviewers.length} registered reviewers.
            </p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="form-label">Subject</label>
                <input type="text" id="email-subject" defaultValue="Message from the JCAS Editorial Team" className="form-input text-sm" />
              </div>
              <div>
                <label className="form-label">Message</label>
                <textarea id="email-body" rows={5} placeholder="Type your message here…" className="form-input text-sm resize-none" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 mb-5 flex items-start gap-2">
              <Mail size={13} className="mt-0.5 flex-shrink-0" />
              Make sure SMTP email is configured in your backend settings before sending.
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEmailModal(false)} className="btn-outline flex-1 py-2 text-sm">Cancel</button>
              <button
                onClick={() => { setEmailModal(false); alert('Email queued. This feature requires SMTP to be configured in the backend.') }}
                className="btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2">
                <Mail size={14} /> Send to All Reviewers
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}