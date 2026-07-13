import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ChevronLeft, FileText, Clock, User, MessageSquare,
  Upload, Download, AlertCircle, CheckCircle, CreditCard,
  ShieldCheck, ShieldX, Loader, X
} from 'lucide-react'
import { manuscriptsApi, paymentsApi, reviewsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const STATUS_CONFIG = {
  draft:              { label: 'DRAFT',              cls: 'bg-gray-100 text-gray-600'    },
  submitted:          { label: 'SUBMITTED',          cls: 'bg-blue-100 text-blue-700'    },
  desk_rejected:      { label: 'DESK REJECTED',      cls: 'bg-red-200 text-red-800'      },
  editor_assigned:    { label: 'EDITOR ASSIGNED',    cls: 'bg-purple-100 text-purple-700'},
  under_review:       { label: 'UNDER REVIEW',       cls: 'bg-yellow-100 text-yellow-700'},
  revision_required:  { label: 'REVISION REQUESTED', cls: 'bg-red-100 text-red-700'      },
  revision_submitted: { label: 'REVISION SUBMITTED', cls: 'bg-orange-100 text-orange-700'},
  accepted:           { label: 'ACCEPTED',           cls: 'bg-green-100 text-green-700'  },
  awaiting_payment:   { label: 'AWAITING PAYMENT',   cls: 'bg-amber-100 text-amber-700'  },
  published:          { label: 'PUBLISHED',          cls: 'bg-green-200 text-green-800'  },
  rejected:           { label: 'REJECTED',           cls: 'bg-red-200 text-red-800'      },
}

const WORKFLOW_STEPS = [
  { key: 'submitted',       label: 'Submitted'    },
  { key: 'editor_assigned', label: 'Editorial'    },
  { key: 'under_review',    label: 'Peer Review'  },
  { key: 'accepted',        label: 'Decision'     },
  { key: 'accepted',        label: 'Payment'      }, // payment step (same trigger key)
  { key: 'published',       label: 'Published'    },
]

// Statuses that map to a workflow step index
const STATUS_STEP_MAP = {
  submitted:          0,
  editor_assigned:    1,
  under_review:       2,
  revision_required:  2,
  revision_submitted: 2,
  accepted:           3,
  awaiting_payment:   4,
  published:          5,
  rejected:           3,
  desk_rejected:      0,
}

const EDITORIAL_ROLES = ['editor', 'editor_in_chief', 'admin']

export default function ManuscriptDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [manuscript,    setManuscript]    = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [downloading,   setDownloading]   = useState(null)
  const [downloadError, setDownloadError] = useState('')
  const [reviews,       setReviews]       = useState([])
  const [payment,       setPayment]       = useState(null)

  // Screening state (EiC only)
  const [screenOpen,    setScreenOpen]    = useState(false)
  const [screenDecision,setScreenDecision]= useState('')
  const [screenReason,  setScreenReason]  = useState('')
  const [screenLoading, setScreenLoading] = useState(false)
  const [screenError,   setScreenError]   = useState('')

  const isEditorial = user && EDITORIAL_ROLES.includes(user.role)
  const isEiC       = user && (user.role === 'editor_in_chief' || user.role === 'admin')

  useEffect(() => {
    manuscriptsApi.get(id)
      .then(data => {
        setManuscript(data)

        // Load reviewer comments if a decision has been made
        const postDecision = ['revision_required','revision_submitted','accepted',
                              'awaiting_payment','rejected','published']
        if (postDecision.includes(data.status)) {
          manuscriptsApi.getAuthorReviews(data.id)
            .then(setReviews)
            .catch(() => {})
        }

        // Load payment for accepted+ manuscripts
        const paymentStatuses = ['accepted','awaiting_payment','published']
        if (paymentStatuses.includes(data.status)) {
          paymentsApi.get(data.id)
            .then(setPayment)
            .catch(() => {})
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async (file) => {
    setDownloadError('')
    setDownloading(file.id)
    try {
      await manuscriptsApi.downloadFile(manuscript.id, file.id, file.filename)
    } catch (err) {
      setDownloadError(`Could not download "${file.filename}". Please try again.`)
    } finally {
      setDownloading(null)
    }
  }

  const handleScreen = async () => {
    if (!screenDecision) { setScreenError('Please choose Accept or Decline.'); return }
    if (screenDecision === 'decline' && !screenReason.trim()) {
      setScreenError('Please provide a reason — it will be emailed to the author.')
      return
    }
    setScreenLoading(true)
    setScreenError('')
    try {
      const updated = await manuscriptsApi.screenManuscript(manuscript.id, screenDecision, screenReason)
      setManuscript(updated)
      setScreenOpen(false)
      setScreenDecision('')
      setScreenReason('')
    } catch (err) {
      setScreenError(err.message || 'Screening failed. Please try again.')
    } finally {
      setScreenLoading(false)
    }
  }

  const [reminderSending, setReminderSending] = useState(false)
  const [reminderSent,    setReminderSent]    = useState(false)

  const handleSendReminder = async () => {
    setReminderSending(true)
    try {
      await manuscriptsApi.sendRevisionReminder(manuscript.id)
      setReminderSent(true)
    } catch (err) {
      setDownloadError(err.message || 'Could not send reminder. Please try again.')
    } finally {
      setReminderSending(false)
    }
  }

  const handleExportPDF = () => {
    const printArea = document.getElementById('review-comments-print')
    if (!printArea) return
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>Review Report — ${manuscript?.manuscript_id}</title>
      <style>
        body  { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #111; line-height: 1.7; }
        h1    { font-size: 20px; margin-bottom: 4px; }
        h2    { font-size: 15px; border-bottom: 1px solid #ccc; padding-bottom: 6px; margin-top: 28px; color: #1e3a5f; }
        p     { font-size: 13px; }
        .meta { font-size: 12px; color: #555; margin-bottom: 28px; }
        .score{ display:inline-block; background:#f3f4f6; border-radius:4px; padding:2px 8px; font-size:11px; margin:2px; }
      </style></head><body>${printArea.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center text-gray-400">
      <Loader size={20} className="animate-spin mr-2" /> Loading…
    </div>
  )

  if (!manuscript) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Manuscript not found.</p>
      <Link to="/dashboard/author" className="text-blue-600 text-sm mt-2 inline-block">← Back to Dashboard</Link>
    </div>
  )

  const cfg             = STATUS_CONFIG[manuscript.status] || { label: manuscript.status, cls: 'bg-gray-100 text-gray-600' }
  const currentStepIdx  = STATUS_STEP_MAP[manuscript.status] ?? 0
  const isRevision      = manuscript.status === 'revision_required'
  const isAccepted      = manuscript.status === 'accepted'
  const needsScreening  = isEiC && manuscript.status === 'submitted' && !manuscript.screened_at
  const screeningPassed = isEiC && manuscript.status === 'submitted' && manuscript.screened_at

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">

      {/* Breadcrumb */}
      <Link to="/dashboard/author"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
        <ChevronLeft size={15} /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg.cls}`}>
              {cfg.label}
            </span>
            <span className="text-xs text-gray-400">{manuscript.manuscript_id}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-snug">{manuscript.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{manuscript.article_type}</p>
        </div>
        {isRevision && (
          <Link to={`/dashboard/author/manuscript/${id}/revise`}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors self-start flex-shrink-0">
            <Upload size={14} /> Upload Revision
          </Link>
        )}
      </div>

      {/* Workflow progress */}
      <div className="card p-5 mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Submission Progress</h3>
        <div className="flex items-center">
          {WORKFLOW_STEPS.map((step, i) => {
            const done    = i < currentStepIdx
            const current = i === currentStepIdx
            return (
              <React.Fragment key={`${step.key}-${i}`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    done    ? 'bg-navy-900 border-navy-900 text-white' :
                    current ? 'bg-white border-navy-900 text-navy-900' :
                    'bg-white border-gray-300 text-gray-400'
                  }`}>
                    {done ? <CheckCircle size={14} /> : i + 1}
                  </div>
                  <p className={`text-[9px] sm:text-xs mt-1.5 font-medium text-center whitespace-nowrap ${
                    done || current ? 'text-navy-900' : 'text-gray-400'
                  }`}>{step.label}</p>
                </div>
                {i < WORKFLOW_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-navy-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Revision alert */}
          {isRevision && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Revision Required</p>
                  <p className="text-xs text-red-600 mt-1 leading-relaxed">
                    The editor has requested revisions. Read all reviewer comments, address each point,
                    and upload your revised manuscript with a response-to-reviewers document.
                  </p>
                  {!isEditorial && (
                    <Link to={`/dashboard/author/manuscript/${id}/revise`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 hover:text-red-900">
                      <Upload size={12} /> Start Revision Upload →
                    </Link>
                  )}
                  {isEditorial && (
                    <button
                      onClick={handleSendReminder}
                      disabled={reminderSending || reminderSent}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-red-700 hover:text-red-900 disabled:opacity-50">
                      {reminderSent ? 'Reminder sent ✓' : reminderSending ? 'Sending…' : 'Send Revision Reminder Email'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Accepted — payment prompt */}
         {isAccepted && !isEditorial && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800"> Manuscript Accepted!</p>
                {payment?.status === 'confirmed' ? (
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">
                    Your APC payment has been confirmed. Your manuscript is queued for publication —
                    you will be notified once it goes live.
                  </p>
                ) : payment?.status === 'submitted' ? (
                  <p className="text-xs text-green-700 mt-1 leading-relaxed">
                    Your payment proof has been received and is awaiting confirmation from the editorial office.
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-green-700 mt-1 leading-relaxed">
                      Congratulations! Please complete the Article Processing Charge (APC)
                      payment to proceed to publication.
                    </p>
                    <Link to={`/dashboard/manuscript/${id}/payment`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold bg-green-700 text-white px-3 py-1.5 rounded-lg hover:bg-green-800 transition-colors">
                      <CreditCard size={12} /> Complete Payment →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

          {/* EiC Screening — for submitted unscreened manuscripts */}
          {needsScreening && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Initial Screening Required</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                    Review the title, abstract, and article type to determine if this submission
                    meets journal scope before sending to peer review.
                  </p>
                </div>
              </div>

              {!screenOpen ? (
                <button onClick={() => setScreenOpen(true)} className="btn-primary text-sm py-2">
                  Screen This Submission
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {['accept', 'decline'].map(d => (
                      <button key={d} onClick={() => setScreenDecision(d)}
                        className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border-2 text-sm font-semibold transition-colors ${
                          screenDecision === d
                            ? d === 'accept'
                              ? 'bg-green-600 border-green-600 text-white'
                              : 'bg-red-600 border-red-600 text-white'
                            : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}>
                        {d === 'accept'
                          ? <><ShieldCheck size={14} /> Accept for Review</>
                          : <><ShieldX size={14} /> Desk Reject</>
                        }
                      </button>
                    ))}
                  </div>

                  {screenDecision === 'decline' && (
                    <textarea
                      value={screenReason}
                      onChange={e => setScreenReason(e.target.value)}
                      placeholder="Reason for rejection (will be emailed to the author)…"
                      rows={3}
                      className="form-input text-sm w-full resize-none"
                    />
                  )}

                  {screenDecision === 'accept' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                      The manuscript will pass screening. You can then assign an editor
                      or invite reviewers from your dashboard.
                    </div>
                  )}

                  {screenError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                      {screenError}
                    </p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setScreenOpen(false); setScreenDecision(''); setScreenReason(''); setScreenError('') }}
                      className="btn-outline text-xs py-1.5 px-3">Cancel</button>
                    <button
                      onClick={handleScreen}
                      disabled={screenLoading || !screenDecision}
                      className={`text-xs px-4 py-1.5 rounded-lg font-semibold text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors ${
                        screenDecision === 'decline' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                      }`}>
                      {screenLoading
                        ? <><Loader size={12} className="animate-spin" /> Processing…</>
                        : screenDecision === 'decline' ? 'Confirm Rejection' : 'Confirm Acceptance'
                      }
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Screened — confirmation */}
          {screeningPassed && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-800">
                Screening complete. Assign an editor or invite reviewers from your dashboard.
              </p>
            </div>
          )}

          {/* Abstract */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Abstract</h3>
            <p className="text-sm text-gray-700 leading-relaxed">{manuscript.abstract}</p>
            {manuscript.keywords && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                {manuscript.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{k}</span>
                ))}
              </div>
            )}
          </div>

          {/* Status History */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">
              Editorial Correspondence
            </h3>
            {manuscript.status_history && manuscript.status_history.length > 0 ? (
              <div className="space-y-4">
                {manuscript.status_history.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0">
                      <User size={13} className="text-navy-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="text-xs font-semibold text-gray-700">
                          Status changed to{' '}
                          <span className="text-navy-900 uppercase">
                            {STATUS_CONFIG[h.to_status]?.label || h.to_status}
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(h.changed_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                      {h.note && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 rounded-lg px-3 py-2">
                          {h.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No editorial correspondence yet.</p>
              </div>
            )}
          </div>

          {/* Reviewer Comments */}
          {reviews.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                  Reviewer Comments
                </h3>
                <button onClick={handleExportPDF}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                  <Download size={12} /> Export PDF
                </button>
              </div>

              <div id="review-comments-print">
                <h1 style={{ fontFamily: 'serif', fontSize: 18 }}>{manuscript.title}</h1>
                <p className="text-xs text-gray-400 mb-4">
                  {manuscript.manuscript_id} · Review Report ·{' '}
                  {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>

                {reviews.map((r, i) => (
                  <div key={r.id || i} className="mb-6 pb-6 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-sm font-bold text-navy-900">
                        Reviewer {r.reviewer_num || i + 1}
                      </h2>
                      {r.recommendation && (
                        <span className="text-xs text-gray-500 capitalize">
                          Recommendation: <strong>{r.recommendation.replace(/_/g, ' ')}</strong>
                        </span>
                      )}
                    </div>

                    {(r.score_originality || r.score_technical || r.score_clarity || r.score_references) && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          ['Originality',  r.score_originality],
                          ['Methodology',  r.score_technical],
                          ['Clarity',      r.score_clarity],
                          ['Significance', r.score_references],
                        ].filter(([, v]) => v).map(([k, v]) => (
                          <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {k}: {v}/4
                          </span>
                        ))}
                      </div>
                    )}

                    {r.comments_to_author ? (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {r.comments_to_author}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No written comments provided.</p>
                    )}

                   {r.files?.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold mb-1">Reviewer Attachments:</p>
                        {r.files.map(f => (
                          <button
                            key={f.id}
                            onClick={() => reviewsApi.downloadReviewFile(f.id, f.filename)
                              .catch(() => alert(`Could not download "${f.filename}".`))}
                            className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                          >
                            <FileText size={11} /> {f.filename}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Manuscript details */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              {[
                ['Manuscript ID', manuscript.manuscript_id],
                ['Article Type',  manuscript.article_type],
                ['Subject Area',  manuscript.subject_area || '—'],
                ['Revision No.',  manuscript.revision_number],
                ['Submitted',     manuscript.submitted_at
                  ? new Date(manuscript.submitted_at).toLocaleDateString('en-GB')
                  : 'Not yet submitted'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-gray-500 flex-shrink-0 text-xs">{k}</dt>
                  <dd className="font-medium text-gray-800 text-right text-xs">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Payment card — for accepted manuscripts */}
          {(isAccepted || manuscript.status === 'awaiting_payment' || manuscript.status === 'published') && (
            <div className="card p-4 border-l-4 border-green-400">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <CreditCard size={12} /> Article Processing Charge
              </h3>

              {payment ? (
                <>
                  <div className={`text-xs font-semibold px-2 py-0.5 rounded w-fit mb-2 ${
                    payment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    payment.status === 'submitted' ? 'bg-blue-100 text-blue-700'  :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {payment.status === 'confirmed' ? 'Payment Confirmed' :
                     payment.status === 'submitted' ? 'Awaiting Confirmation' :
                     'Payment Required'}
                  </div>
                  <p className="text-xl font-bold text-navy-900 mb-3">
                    {payment.currency} {Number(payment.amount || 0).toLocaleString()}
                  </p>
                  {payment.status !== 'confirmed' && !isEditorial && (
                    <Link to={`/dashboard/manuscript/${id}/payment`}
                      className="btn-primary text-xs w-full text-center block py-2">
                      {payment.status === 'submitted' ? 'View Payment Status' : 'Make Payment'}
                    </Link>
                  )}
                  {payment.status === 'confirmed' && (
                    <div className="flex items-center gap-1.5 text-xs text-green-700">
                      <CheckCircle size={12} /> Confirmed —{' '}
                      {payment.confirmed_at
                        ? new Date(payment.confirmed_at).toLocaleDateString('en-GB')
                        : ''}
                    </div>
                  )}
                </>
              ) : (
                // Payment record not loaded yet but status is accepted — show link anyway
                !isEditorial && (
                  <Link to={`/dashboard/manuscript/${id}/payment`}
                    className="btn-primary text-xs w-full text-center block py-2">
                    Complete APC Payment
                  </Link>
                )
              )}
            </div>
          )}

          {/* Files */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Files</h3>
            {downloadError && (
              <div className="mb-2 flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                <AlertCircle size={12} className="shrink-0" /> {downloadError}
              </div>
            )}
            {manuscript.files && manuscript.files.length > 0 ? (
              <div className="space-y-2">
                {manuscript.files.map(f => (
                  <div key={f.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                    <FileText size={13} className="text-navy-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-gray-800 truncate">{f.filename}</p>
                      <p className="text-xs text-gray-400 capitalize">{f.file_type?.replace('_', ' ')}</p>
                    </div>
                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloading === f.id}
                      className="text-blue-600 hover:text-blue-800 flex-shrink-0 disabled:opacity-40"
                      title="Download">
                      <Download size={13} className={downloading === f.id ? 'animate-pulse' : ''} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No files uploaded.</p>
            )}
          </div>

          {/* Co-authors */}
          {manuscript.co_authors && manuscript.co_authors.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Authors</h3>
              <div className="space-y-2">
                {manuscript.co_authors.map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {a.name?.[0]}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{a.name}</p>
                      <p className="text-xs text-gray-500">{a.affiliation}</p>
                      {a.is_corresponding && (
                        <span className="text-[10px] text-blue-600 font-medium">Corresponding</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}