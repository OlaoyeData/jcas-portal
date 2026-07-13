import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, UserPlus, Send, FileText,
  CheckCircle, Search, AlertCircle, Mail,
  BookOpen, Loader, Download
} from 'lucide-react'
import { manuscriptsApi, reviewsApi, usersApi, archiveApi, paymentsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const DECISION_TEMPLATES = {
  accepted:          'Dear Author,\n\nWe are pleased to inform you that your manuscript "{title}" has been accepted for publication in JCAS.\n\nThe editorial team will be in touch shortly regarding the next steps for publication.\n\nWe congratulate you on this achievement.\n\nBest regards,\nThe JCAS Editorial Team',
  minor_revision:    'Dear Author,\n\nThank you for submitting your manuscript "{title}" to JCAS.\n\nAfter careful consideration by the reviewers, we request minor revisions before a final decision can be made. Please find the reviewer comments attached.\n\nPlease submit your revised manuscript within 21 days.\n\nBest regards,\nThe JCAS Editorial Team',
  major_revision:    'Dear Author,\n\nThank you for submitting your manuscript "{title}" to JCAS.\n\nThe reviewers have raised several substantive concerns that require major revisions. We invite you to revise and resubmit your work addressing the comments in full.\n\nPlease submit your revised manuscript within 60 days.\n\nBest regards,\nThe JCAS Editorial Team',
  rejected:          'Dear Author,\n\nThank you for considering JCAS for the submission of your manuscript "{title}".\n\nAfter careful review, we regret to inform you that we are unable to accept your manuscript for publication at this time.\n\nWe appreciate your interest in JCAS and encourage you to consider future submissions.\n\nBest regards,\nThe JCAS Editorial Team',
}

export default function SubmissionManagementPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isEiC = user?.role === 'editor_in_chief' || user?.role === 'admin'
  const backPath = isEiC
    ? '/dashboard/editor_in_chief'
    : '/dashboard/editor'

  const [manuscript,    setManuscript]    = useState(null)
  const [reviews,       setReviews]       = useState([])
  const [reviewers,     setReviewers]     = useState([])
  const [volumes,       setVolumes]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [reviewerSearch,setReviewerSearch]= useState('')
  const [activeTab,     setActiveTab]     = useState('details')

  // Decision state
  const [decision,      setDecision]      = useState('')
  const [decisionLetter,setDecisionLetter]= useState('')
  const [sending,       setSending]       = useState(false)
  const [decisionSent,  setDecisionSent]  = useState(false)
  const [decisionError, setDecisionError] = useState('')

  // Publish state
  const [publishForm, setPublishForm] = useState({
    issue_id:    '',
    doi:         '',
    page_start:  '',
    page_end:    '',
  })
  const [publishing,    setPublishing]    = useState(false)
  const [publishError,  setPublishError]  = useState('')
  const [publishDone,   setPublishDone]   = useState(false)
  const [pubPayment, setPubPayment] = useState(null)

  // Invite state
  const [inviting, setInviting] = useState(null)  // reviewer id being invited
  const [inviteError, setInviteError] = useState('')
  const [sharingFileId, setSharingFileId] = useState(null)

  useEffect(() => {
    Promise.all([
      manuscriptsApi.get(id),
      reviewsApi.getManuscriptReviews(id).catch(() => []),
      usersApi.reviewers().catch(() => []),
      archiveApi.volumes().catch(() => []),
    ]).then(([ms, revs, revUsers, vols]) => {
      setManuscript(ms)
      setReviews(revs   || [])
      setReviewers(revUsers || [])
      setVolumes(vols   || [])
      if (ms.status === 'published') setPublishDone(true)
      if (ms.status === 'accepted' && isEiC) setActiveTab('publish')
      if (isEiC && (ms.status === 'accepted' || ms.status === 'awaiting_payment' || ms.status === 'published')) {
        paymentsApi.get(id, 'publication').then(setPubPayment).catch(() => setPubPayment(null))
      }
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (decision && manuscript) {
      const template = DECISION_TEMPLATES[decision] || ''
      setDecisionLetter(template.replace('{title}', manuscript.title))
    }
  }, [decision, manuscript])

  const handleSendDecision = async () => {
    if (!decision) return
    setSending(true)
    setDecisionError('')
    const statusMap = {
      accepted:       'accepted',
      minor_revision: 'revision_required',
      major_revision: 'revision_required',
      rejected:       'rejected',
    }
    try {
      await manuscriptsApi.decision(id, statusMap[decision], decisionLetter)
      setDecisionSent(true)
      // Refresh manuscript status
      const updated = await manuscriptsApi.get(id).catch(() => manuscript)
      setManuscript(updated)
    } catch (err) {
      setDecisionError(err.message || 'Failed to send decision.')
    } finally {
      setSending(false)
    }
  }

  const handleInviteReviewer = async (reviewerId) => {
    setInviting(reviewerId)
    setInviteError('')
    try {
      await reviewsApi.inviteReviewer(id, reviewerId, null)
    } catch (err) {
      setInviteError(err.message || 'Failed to invite reviewer.')
    } finally {
      setInviting(null)
    }
  }

  const handlePublish = async () => {
    setPublishError('')
    if (!publishForm.issue_id)   { setPublishError('Please select a volume and issue.'); return }
    if (!publishForm.doi.trim()) { setPublishError('Please enter a DOI.'); return }
    if (!publishForm.page_start) { setPublishError('Please enter a start page.'); return }
    if (!publishForm.page_end)   { setPublishError('Please enter an end page.'); return }

    setPublishing(true)
    try {
      await archiveApi.publish(id, {
        issue_id:    parseInt(publishForm.issue_id),
        doi:         publishForm.doi.trim(),
        page_start:  parseInt(publishForm.page_start),
        page_end:    parseInt(publishForm.page_end),
      })
      setPublishDone(true)
      const updated = await manuscriptsApi.get(id).catch(() => manuscript)
      setManuscript(updated)
    } catch (err) {
      setPublishError(err.message || 'Failed to publish. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const handleDownload = async (file) => {
  try {
    await manuscriptsApi.downloadFile(manuscript.id, file.id, file.filename)
  } catch {
    alert(`Could not download "${file.filename}".`)
  }
}

const handleShareReviewFile = async (fileId) => {
  setSharingFileId(fileId)
  try {
    await reviewsApi.shareReviewFile(fileId)
    setReviews(prev => prev.map(rev => ({
      ...rev,
      files: (rev.files || []).map(f =>
        f.id === fileId ? { ...f, shared_with_author: true } : f
      ),
    })))
  } catch (err) {
    alert(err.message || 'Failed to forward file to the author.')
  } finally {
    setSharingFileId(null)
  }
}

const handleDownloadReviewFile = async (file) => {
  try {
    await reviewsApi.downloadReviewFile(file.id, file.filename)
  } catch {
    alert(`Could not download "${file.filename}".`)
  }
}

  const filteredReviewers = reviewers.filter(r =>
    !reviewerSearch ||
    r.name.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    r.affiliation?.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    r.expertise_areas?.toLowerCase().includes(reviewerSearch.toLowerCase())
  )

  // Flatten all issues for the dropdown
  const allIssues = volumes.flatMap(vol =>
    (vol.issues || []).map(iss => ({
      id:    iss.id,
      label: `Vol. ${vol.volume_number} (${vol.year}) — Issue ${iss.issue_number}${iss.period ? ` · ${iss.period}` : ''}`,
    }))
  )

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!manuscript) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Manuscript not found.</p>
      <Link to={backPath} className="text-blue-600 text-sm mt-2 inline-block">← Back</Link>
    </div>
  )

  const completedReviews = reviews.length
  const canMakeDecision  = completedReviews >= 2 || manuscript.status === 'revision_submitted'
  const isAccepted       = manuscript.status === 'accepted'
  const isPublished      = manuscript.status === 'published'

  const tabs = [
    { key: 'details',   label: 'Details & Abstract' },
    { key: 'reviewers', label: `Reviews (${completedReviews})` },
    { key: 'assign',    label: 'Assign Reviewers' },
    { key: 'decision',  label: 'Decision' },
    ...((isAccepted || isPublished) && isEiC ? [{ key: 'publish', label: 'Publish' }] : []),
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <Link to={backPath} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
        <ChevronLeft size={15} /> Back to Queue
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs text-gray-400 font-medium">{manuscript.manuscript_id}</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${
              manuscript.status === 'under_review'    ? 'bg-yellow-100 text-yellow-700' :
              manuscript.status === 'accepted'        ? 'bg-green-100 text-green-700'   :
              manuscript.status === 'published'       ? 'bg-green-200 text-green-900'   :
              manuscript.status === 'rejected'        ? 'bg-red-100 text-red-700'       :
              'bg-gray-100 text-gray-600'
            }`}>
              {manuscript.status?.replace(/_/g, ' ')}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900 leading-snug">{manuscript.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{manuscript.article_type}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
              activeTab === t.key
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Details Tab ────────────────────────────────────────────────── */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
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
            {manuscript.files?.length > 0 && (
              <div className="card p-5">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Files</h3>
                <div className="space-y-2">
                  {manuscript.files.map(f => (
                    <div key={f.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                      <FileText size={14} className="text-navy-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{f.filename}</p>
                        <p className="text-xs text-gray-400 capitalize">{f.file_type}</p>
                      </div>
                      <button onClick={() => handleDownload(f)}
                        className="flex items-center gap-1 text-blue-600 text-xs hover:underline">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Submission Details</h3>
              <dl className="space-y-2 text-sm">
                {[
                  ['Type',      manuscript.article_type],
                  ['Subject',   manuscript.subject_area || '—'],
                  ['Revision',  `#${manuscript.revision_number}`],
                  ['Submitted', manuscript.submitted_at ? new Date(manuscript.submitted_at).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-gray-500">{k}</dt>
                    <dd className="font-medium text-gray-800 text-right text-xs">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* ── Reviews Tab ────────────────────────────────────────────────── */}
      {activeTab === 'reviewers' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="card p-10 text-center text-gray-500">
              <FileText size={32} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No reviews submitted yet.</p>
              <p className="text-sm text-gray-400 mt-1">Go to "Assign Reviewers" to invite reviewers.</p>
            </div>
          ) : reviews.map((rev, i) => (
            <div key={rev.id} className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-navy-900">Reviewer {i + 1} <span className="text-xs text-gray-400">(Anonymous)</span></h3>
               {rev.recommendation && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    rev.recommendation === 'accept'         ? 'bg-green-100 text-green-700'   :
                    rev.recommendation === 'minor_revision' ? 'bg-blue-100 text-blue-700'     :
                    rev.recommendation === 'major_revision' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {rev.recommendation.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  ['Originality',  rev.score_originality],
                  ['Methodology',  rev.score_technical],
                  ['Clarity',      rev.score_clarity],
                  ['Significance', rev.score_references],
                ].map(([label, score]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-navy-900">{score ?? '—'}<span className="text-xs text-gray-400">/4</span></p>
                    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              {rev.comments_to_author && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Comments to Author</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed">{rev.comments_to_author}</p>
                </div>
              )}
              {rev.comments_to_editor && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Confidential Comments to Editor</p>
                <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3 leading-relaxed">{rev.comments_to_editor}</p>
              </div>
            )}
            {rev.files?.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Supplementary Files
                </p>
                <div className="space-y-2">
                  {rev.files.map(f => (
                    <div key={f.id} className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => handleDownloadReviewFile(f)}
                        className="flex items-center gap-2 text-xs text-navy-700 hover:underline min-w-0"
                      >
                        <FileText size={13} className="flex-shrink-0" />
                        <span className="truncate">{f.filename}</span>
                      </button>
                      {f.shared_with_author ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-700 flex-shrink-0">
                          <CheckCircle size={12} /> Shared with author
                        </span>
                      ) : (
                        <button
                          onClick={() => handleShareReviewFile(f.id)}
                          disabled={sharingFileId === f.id}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-navy-700 text-white hover:bg-navy-800 font-semibold disabled:opacity-50 flex-shrink-0"
                        >
                          {sharingFileId === f.id
                            ? <Loader size={11} className="animate-spin" />
                            : <Send size={11} />
                          }
                          Forward to Author
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          ))}
        </div>
      )}

      {/* ── Assign Reviewers Tab ───────────────────────────────────────── */}
      {activeTab === 'assign' && (
        <div className="max-w-2xl space-y-4">
          {inviteError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle size={14} /> {inviteError}
            </div>
          )}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={reviewerSearch} onChange={e => setReviewerSearch(e.target.value)}
              placeholder="Search reviewers by name, expertise, or institution…"
              className="form-input pl-9 text-sm" />
          </div>
          {filteredReviewers.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No reviewers found.</p>
          ) : filteredReviewers.map(rev => (
            <div key={rev.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-navy-100 text-navy-800 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {rev.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900">{rev.name}</p>
                  <p className="text-xs text-gray-500">{rev.affiliation}</p>
                  {rev.expertise_areas && <p className="text-xs text-blue-600 mt-0.5">{rev.expertise_areas}</p>}
                </div>
              </div>
              <button onClick={() => handleInviteReviewer(rev.id)} disabled={inviting === rev.id}
                className="flex items-center gap-1.5 bg-navy-900 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-navy-800 transition-colors flex-shrink-0 disabled:opacity-50">
                {inviting === rev.id
                  ? <><Loader size={11} className="animate-spin" /> Inviting…</>
                  : <><UserPlus size={13} /> Invite</>
                }
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Decision Tab ───────────────────────────────────────────────── */}
      {activeTab === 'decision' && (
        <div className="max-w-2xl space-y-5">
          {!canMakeDecision && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                At least 2 completed reviews are recommended before making a decision.
                Currently {completedReviews} review{completedReviews !== 1 ? 's have' : ' has'} been submitted.
              </p>
            </div>
          )}

          {decisionSent ? (
            <div className="card p-8 text-center">
              <CheckCircle size={40} className="mx-auto text-green-500 mb-3" />
              <h3 className="font-bold text-navy-900 text-lg mb-1">Decision Sent</h3>
              <p className="text-gray-500 text-sm">The decision has been recorded and the author notified.</p>
              {manuscript.status === 'accepted' && (
                <button onClick={() => setActiveTab('publish')}
                  className="btn-primary mt-4 inline-flex items-center gap-2">
                  <BookOpen size={14} /> Proceed to Publish →
                </button>
              )}
            </div>
          ) : (
            <>
              {decisionError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle size={14} /> {decisionError}
                </div>
              )}
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-4">Select Decision</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'accepted',       label: 'Accept',         cls: 'border-green-300 bg-green-50 text-green-800'    },
                    { value: 'minor_revision', label: 'Minor Revision', cls: 'border-blue-300 bg-blue-50 text-blue-800'       },
                    { value: 'major_revision', label: 'Major Revision', cls: 'border-orange-300 bg-orange-50 text-orange-800' },
                    { value: 'rejected',       label: 'Reject',         cls: 'border-red-300 bg-red-50 text-red-800'          },
                  ].map(d => (
                    <label key={d.value}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        decision === d.value ? d.cls : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <input type="radio" name="decision" value={d.value}
                        checked={decision === d.value} onChange={() => setDecision(d.value)}
                        className="text-navy-700" />
                      <span className="font-semibold text-sm">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-1">Decision Letter</h3>
                <p className="text-xs text-gray-500 mb-3">Pre-populated from template — edit as needed.</p>
                <textarea value={decisionLetter} onChange={e => setDecisionLetter(e.target.value)} rows={12}
                  placeholder="Select a decision above to auto-populate the letter…"
                  className="form-input text-sm resize-y leading-relaxed" />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={handleSendDecision} disabled={!decision || !decisionLetter || sending}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                  {sending ? <><Loader size={14} className="animate-spin" /> Sending…</> : <><Mail size={14} /> Send Decision</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Publish Tab ────────────────────────────────────────────────── */}
      {activeTab === 'publish' && (
        <div className="max-w-2xl space-y-5">

          {publishDone || isPublished ? (
            <div className="card p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen size={26} className="text-green-600" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg mb-1">Article Published</h3>
              <p className="text-gray-500 text-sm mb-4">
                This manuscript is now live in the journal archive and visible to the public.
              </p>
              <Link to="/archive" className="btn-primary inline-flex items-center gap-2">
                <BookOpen size={14} /> View in Archive
              </Link>
            </div>
          ) : pubPayment && pubPayment.status !== 'confirmed' ? (
            <div className="card p-8 text-center">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={26} className="text-amber-600" />
              </div>
              <h3 className="font-bold text-navy-900 text-lg mb-1">Publication Fee Not Yet Confirmed</h3>
              <p className="text-gray-500 text-sm mb-1 max-w-md mx-auto">
                {pubPayment.status === 'submitted'
                  ? 'The author has uploaded proof of payment. Confirm it from the Pending Payment Confirmations section on your dashboard before publishing.'
                  : 'The author has been notified of acceptance but has not yet paid or submitted proof of the publication fee. Publishing will unlock automatically once payment is confirmed.'}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Amount due: {pubPayment.currency === 'NGN' ? '₦' : pubPayment.currency + ' '}
                {Number(pubPayment.amount).toLocaleString()} · Status: <span className="font-semibold capitalize">{pubPayment.status}</span>
              </p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <BookOpen size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Ready to Publish</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    This manuscript has been accepted. Assign it to a volume/issue and enter publication details below.
                  </p>
                </div>
              </div>

              {publishError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                  <AlertCircle size={14} className="shrink-0" /> {publishError}
                </div>
              )}

              <div className="card p-5 space-y-4">

                <div>
                  <label className="form-label">Volume & Issue <span className="text-red-500">*</span></label>
                  <select value={publishForm.issue_id}
                    onChange={e => setPublishForm(p => ({ ...p, issue_id: e.target.value }))}
                    className="form-input text-sm">
                    <option value="">Select a volume and issue…</option>
                    {allIssues.map(iss => (
                      <option key={iss.id} value={iss.id}>{iss.label}</option>
                    ))}
                  </select>
                  {allIssues.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No volumes or issues found. Create one first via the Admin panel or API.
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">
                    DOI <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal normal-case ml-1">e.g. 10.1234/jcas.2025.001</span>
                  </label>
                  <input type="text" value={publishForm.doi}
                    onChange={e => setPublishForm(p => ({ ...p, doi: e.target.value }))}
                    placeholder="10.xxxxx/jcas.yyyy.nnn"
                    className="form-input text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Start Page <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={publishForm.page_start}
                      onChange={e => setPublishForm(p => ({ ...p, page_start: e.target.value }))}
                      placeholder="1" className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="form-label">End Page <span className="text-red-500">*</span></label>
                    <input type="number" min="1" value={publishForm.page_end}
                      onChange={e => setPublishForm(p => ({ ...p, page_end: e.target.value }))}
                      placeholder="12" className="form-input text-sm" />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 uppercase tracking-wide flex-shrink-0">
                    Open Access
                  </span>
                  <p className="text-xs text-green-700">
                    JCAS publishes all articles as open access — free to read and download by anyone.
                  </p>
                </div>

              </div>

              <div className="flex justify-end">
                <button onClick={handlePublish} disabled={publishing}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {publishing
                    ? <><Loader size={14} className="animate-spin" /> Publishing…</>
                    : <><BookOpen size={14} /> Publish Article</>
                  }
                </button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}