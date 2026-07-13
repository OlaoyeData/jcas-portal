import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronLeft, ZoomIn, ZoomOut, Clock, Save,
  Send, CheckCircle, Download, FileText, AlertCircle, Loader,
  Upload, X
} from 'lucide-react'
import { reviewsApi, manuscriptsApi } from '../../services/api'

const CRITERIA = [
  { key: 'score_originality', label: 'Originality',   description: 'Does the manuscript present novel and original research contributions?' },
  { key: 'score_technical',   label: 'Methodology',   description: 'Are the methods, algorithms, and data analysis sound and reproducible?' },
  { key: 'score_clarity',     label: 'Clarity',       description: 'Is the writing clear, well-structured, and easy to follow?' },
  { key: 'score_references',  label: 'Significance',  description: 'What is the significance and impact of this work to the field?' },
]

const RATINGS = [
  { label: '1 — Poor',      value: 1 },
  { label: '2 — Fair',      value: 2 },
  { label: '3 — Good',      value: 3 },
  { label: '4 — Excellent', value: 4 },
]

const RECOMMENDATIONS = [
  { value: 'accept',         label: 'Accept',         color: 'text-green-700 border-green-300 bg-green-50'   },
  { value: 'minor_revision', label: 'Minor Revision', color: 'text-blue-700 border-blue-300 bg-blue-50'     },
  { value: 'major_revision', label: 'Major Revision', color: 'text-orange-700 border-orange-300 bg-orange-50'},
  { value: 'reject',         label: 'Reject',         color: 'text-red-700 border-red-300 bg-red-50'        },
]

function daysLeft(deadline) {
  if (!deadline) return null
  return Math.max(0, Math.ceil((new Date(deadline) - new Date()) / 86400000))
}

export default function ReviewFormPage() {
  const { id }   = useParams()   // assignment id
  const navigate = useNavigate()

  // ── Data ──────────────────────────────────────────────────────────────────
  const [assignment,  setAssignment]  = useState(null)
  const [manuscript,  setManuscript]  = useState(null)
  const [loadError,   setLoadError]   = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  // ── Form state ────────────────────────────────────────────────────────────
  const [scores,           setScores]           = useState({
    score_originality: null,
    score_technical:   null,
    score_clarity:     null,
    score_references:  null,
  })
  const [recommendation,   setRecommendation]   = useState('')
  const [commentsToAuthor, setCommentsToAuthor] = useState('')
  const [commentsToEditor, setCommentsToEditor] = useState('')
  const [conflictNote,     setConflictNote]     = useState('')

  // ── UI state ──────────────────────────────────────────────────────────────
  const [saving,       setSaving]       = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [saveError,    setSaveError]    = useState('')
  const [submitted,    setSubmitted]    = useState(false)
  const [downloading,  setDownloading]  = useState(null)
  const [zoom,         setZoom]         = useState(100)
  const [reviewFiles,   setReviewFiles]   = useState([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [dragActive,    setDragActive]    = useState(false)

  useEffect(() => {
    if (assignment?.review?.files) {
      setReviewFiles(assignment.review.files)
    }
  }, [assignment])

  const handleUploadReviewFile = async (file) => {
  if (!file) return
  setUploadingFile(true)
  setSaveError('')
  try {
    const f = await reviewsApi.uploadReviewFile(id, file)
    setReviewFiles(prev => [...prev, f])
  } catch (err) {
    setSaveError(err.message || 'File upload failed')
  } finally {
    setUploadingFile(false)
  }
}

const handleDropFiles = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
  const files = Array.from(e.dataTransfer.files || [])
  files.forEach(f => handleUploadReviewFile(f))
}

const handleDragOver = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(true)
}

const handleDragLeave = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)
}

  const handleDeleteReviewFile = async (fileId) => {
    try {
      await reviewsApi.deleteReviewFile(id, fileId)
      setReviewFiles(prev => prev.filter(f => f.id !== fileId))
    } catch (err) {
      setSaveError(err.message || 'Delete failed')
    }
  }


  // ── Load assignment + existing draft ──────────────────────────────────────
  useEffect(() => {
    const assignmentId = parseInt(id)

    Promise.all([
      reviewsApi.myActive().catch(() => []),
      reviewsApi.getReview(id).catch(() => null),
    ]).then(async ([active, existingReview]) => {
      const found = (active || []).find(a => a.id === assignmentId)
      if (!found) {
        setLoadError('Assignment not found or you no longer have access.')
        return
      }
      setAssignment(found)

      // Load full manuscript details for file list
      if (found.manuscript_id) {
        const ms = await manuscriptsApi.get(found.manuscript_id).catch(err => {
        console.warn('Could not load manuscript:', err.message)
        return null
        })
        setManuscript(ms)
      }

      // Pre-fill form if draft exists
      if (existingReview) {
        setScores({
          score_originality: existingReview.score_originality ?? null,
          score_technical:   existingReview.score_technical   ?? null,
          score_clarity:     existingReview.score_clarity     ?? null,
          score_references:  existingReview.score_references  ?? null,
        })
        setRecommendation(existingReview.recommendation   || '')
        setCommentsToAuthor(existingReview.comments_to_author || '')
        setCommentsToEditor(existingReview.comments_to_editor || '')
      }
    }).catch(err => {
      setLoadError(err.message || 'Failed to load review.')
    }).finally(() => setPageLoading(false))
  }, [id])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const buildPayload = (isDraft) => ({
    score_originality:  scores.score_originality,
    score_technical:    scores.score_technical,
    score_clarity:      scores.score_clarity,
    score_references:   scores.score_references,
    recommendation:     recommendation || null,
    comments_to_author: commentsToAuthor,
    comments_to_editor: commentsToEditor,
    is_draft:           isDraft,
  })

  const handleSaveDraft = async () => {
    setSaving(true)
    setSaveError('')
    try {
      await reviewsApi.saveReview(id, buildPayload(true))
    } catch (err) {
      setSaveError(err.message || 'Failed to save draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSaveError('')
    if (!recommendation)          { setSaveError('Please select a recommendation.'); return }
    if (!commentsToAuthor.trim()) { setSaveError('Comments to author are required.'); return }
    const allScored = Object.values(scores).every(v => v !== null)
    if (!allScored)               { setSaveError('Please rate all four evaluation criteria.'); return }

    setSubmitting(true)
    try {
      await reviewsApi.saveReview(id, buildPayload(false))
      setSubmitted(true)
    } catch (err) {
      setSaveError(err.message || 'Failed to submit review.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDownload = async (file) => {
    setDownloading(file.id)
    try {
      await manuscriptsApi.downloadFile(manuscript.id, file.id, file.filename)
    } catch {
      setSaveError(`Could not download "${file.filename}". Please try again.`)
    } finally {
      setDownloading(null)
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  if (pageLoading) return (
    <div className="flex items-center justify-center h-screen text-gray-400">
      <Loader size={24} className="animate-spin mr-3" /> Loading review…
    </div>
  )

  if (loadError) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center max-w-sm">
        <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
        <p className="font-semibold text-gray-700 mb-1">Could not load review</p>
        <p className="text-sm text-gray-500 mb-4">{loadError}</p>
        <button onClick={() => navigate('/dashboard/reviewer/active')} className="btn-outline text-sm">
          ← Back to Active Reviews
        </button>
      </div>
    </div>
  )

  if (submitted) return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Review Submitted</h2>
        <p className="text-gray-500 mb-2">
          Your review for <strong>{assignment?.manuscript?.title || `Assignment #${id}`}</strong> has been submitted.
        </p>
        <p className="text-sm text-gray-400 mb-6">The editorial team has been notified. Thank you for your contribution.</p>
        <button onClick={() => navigate('/dashboard/reviewer')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  const days = daysLeft(assignment?.deadline)

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-100 overflow-hidden">

      {/* ── Left: Manuscript Viewer ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-white border-r border-gray-200">

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button onClick={() => navigate('/dashboard/reviewer/active')}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-navy-700 mr-2">
            <ChevronLeft size={14} /> Back
          </button>
          <div className="w-px h-5 bg-gray-300" />
          <button onClick={() => setZoom(z => Math.max(50,  z - 10))}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="Zoom out">
            <ZoomOut size={15} />
          </button>
          <span className="text-sm text-gray-600 font-medium w-14 text-center">{zoom}%</span>
          <button onClick={() => setZoom(z => Math.min(200, z + 10))}
            className="p-1.5 rounded hover:bg-gray-200 text-gray-500" title="Zoom in">
            <ZoomIn size={15} />
          </button>
        </div>

        {/* Manuscript content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s' }}>
            <div className="max-w-2xl mx-auto">

              {/* Title + meta */}
              <h1 className="text-2xl font-bold text-center mb-1 leading-tight">
                {assignment?.manuscript?.title || manuscript?.title || `Manuscript #${assignment?.manuscript_id}`}
              </h1>
              <p className="text-center text-sm text-gray-500 mb-6">
                Submitted to JCAS · Assignment #{id}
              </p>

              {/* Abstract */}
              {(assignment?.manuscript?.abstract || manuscript?.abstract) && (
                <>
                  <h2 className="text-xl font-semibold mb-3">Abstract</h2>
                  <p className="text-gray-700 leading-relaxed mb-6 text-justify">
                    {assignment?.manuscript?.abstract || manuscript?.abstract}
                  </p>
                </>
              )}

              {/* Keywords */}
              {manuscript?.keywords && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-2">Keywords</h2>
                  <div className="flex flex-wrap gap-2">
                    {manuscript.keywords.split(',').map(k => k.trim()).filter(Boolean).map(k => (
                      <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{k}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Files — download buttons */}
              <div className="mt-6 border border-gray-200 rounded-xl p-5 bg-gray-50">
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-navy-600" /> Manuscript Files
                </h2>
                {manuscript?.files && manuscript.files.length > 0 ? (
                  <div className="space-y-2">
                    {manuscript.files.map(f => (
                      <div key={f.id} className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{f.filename}</p>
                          <p className="text-xs text-gray-400 capitalize">{f.file_type} file</p>
                        </div>
                        <button
                          onClick={() => handleDownload(f)}
                          disabled={downloading === f.id}
                          className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 flex-shrink-0"
                        >
                          {downloading === f.id
                            ? <Loader size={12} className="animate-spin" />
                            : <Download size={12} />
                          }
                          {downloading === f.id ? 'Downloading…' : 'Download'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No files attached to this manuscript.</p>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Review Form ─────────────────────────────────────────── */}
      <div className="w-full lg:w-[430px] flex flex-col bg-white border-t lg:border-t-0 border-gray-200 overflow-hidden flex-shrink-0">

        {/* Form header */}
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex items-start justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Review Form</h2>
            <p className="text-xs text-gray-500 mt-0.5">Assignment #{id} · Peer Review Stage</p>
          </div>
          {days !== null && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border ${
              days <= 7  ? 'bg-red-50 border-red-200 text-red-700' :
              days <= 14 ? 'bg-orange-50 border-orange-200 text-orange-700' :
              'bg-gray-50 border-gray-200 text-gray-600'
            }`}>
              <Clock size={11} />
              {days === 0 ? 'DUE TODAY' : `DUE IN ${days} DAY${days !== 1 ? 'S' : ''}`}
            </span>
          )}
        </div>

        <div className="flex-1 px-5 py-5 space-y-6 overflow-y-auto">

          {/* Evaluation Criteria */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-1 border-b border-gray-100">
              Evaluation Criteria
            </h3>
            <div className="space-y-4">
              {CRITERIA.map(c => (
                <div key={c.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-semibold text-gray-800">{c.label}</p>
                    <span className="text-xs text-red-500 font-medium">*Required</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3 leading-relaxed">{c.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {RATINGS.map(r => (
                      <label key={r.value} className={`flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg border transition-all ${
                        scores[c.key] === r.value
                          ? 'bg-navy-900 border-navy-900 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-navy-300'
                      }`}>
                        <input type="radio" name={c.key}
                          checked={scores[c.key] === r.value}
                          onChange={() => setScores(p => ({ ...p, [c.key]: r.value }))}
                          className="sr-only" />
                        {r.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recommendation */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">
              Overall Recommendation
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {RECOMMENDATIONS.map(r => (
                <button key={r.value} onClick={() => setRecommendation(r.value)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                    recommendation === r.value
                      ? r.color + ' border-current'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                  {r.label}
                </button>
              ))}
            </div>
          </section>

          {/* Detailed Feedback */}
          <section>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 pb-1 border-b border-gray-100">
              Detailed Feedback
            </h3>
            <div className="space-y-4">

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-800">Comments to Author(s)</label>
                  <span className="text-xs text-red-500 font-medium">*Required</span>
                </div>
                <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                  Constructive feedback visible to the authors.
                </p>
                <textarea value={commentsToAuthor} onChange={e => setCommentsToAuthor(e.target.value)}
                  rows={6} className="form-input resize-y text-sm leading-relaxed"
                  placeholder="Enter your detailed comments for the authors…" />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {commentsToAuthor.split(/\s+/).filter(Boolean).length} words
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                  Confidential Comments to Editor
                </label>
                <p className="text-xs text-gray-500 mb-2">Optional. Only visible to the editor.</p>
                <textarea value={commentsToEditor} onChange={e => setCommentsToEditor(e.target.value)}
                  rows={3} className="form-input resize-y text-sm"
                  placeholder="Any confidential notes for the editorial team…" />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">
                  Conflict of Interest Declaration
                </label>
                <textarea value={conflictNote} onChange={e => setConflictNote(e.target.value)}
                  rows={2} className="form-input resize-y text-sm"
                  placeholder="Declare any conflicts of interest, or state 'None declared'." />
              </div>

            </div>
          </section>
        </div>

        {/* Supplementary Files */}
        <div className="card p-5">
          <h3 className="font-semibold text-navy-900 mb-1">Supplementary Files</h3>
          <p className="text-xs text-gray-500 mb-4">
            Attach annotated PDFs, datasets, or any supporting material for the editor and author.
          </p>

          {reviewFiles.length > 0 && (
            <div className="space-y-2 mb-3">
              {reviewFiles.map(f => (
                <div key={f.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText size={13} className="text-navy-600 flex-shrink-0" />
                  <p className="text-xs text-gray-700 flex-1 truncate">{f.filename}</p>
                  <button
                    onClick={() => handleDeleteReviewFile(f.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <label
            onDrop={handleDropFiles}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`flex flex-col items-center justify-center gap-2 w-full py-8 px-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
              dragActive
                ? 'border-navy-500 bg-navy-50'
                : 'border-gray-300 hover:border-navy-400 hover:bg-gray-50'
            }`}
          >
            {uploadingFile ? (
              <>
                <Loader size={20} className="animate-spin text-navy-500" />
                <p className="text-xs text-gray-500">Uploading…</p>
              </>
            ) : (
              <>
                <Upload size={20} className="text-gray-400" />
                <p className="text-xs text-gray-600 text-center">
                  <span className="font-semibold text-navy-700">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-400">PDF, DOCX, XLSX, ZIP — up to 25 MB</p>
              </>
            )}
            <input
              type="file"
              className="sr-only"
              disabled={uploadingFile}
              onChange={e => { handleUploadReviewFile(e.target.files[0]); e.target.value = '' }}
            />
          </label>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          {saveError && (
            <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
              <AlertCircle size={12} className="shrink-0" /> {saveError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button onClick={handleSaveDraft} disabled={saving || submitting}
              className="btn-outline text-sm py-2 flex items-center gap-2 disabled:opacity-60">
              {saving
                ? <><Loader size={13} className="animate-spin" /> Saving…</>
                : <><Save size={13} /> Save Draft</>
              }
            </button>
            <button onClick={handleSubmit} disabled={saving || submitting}
              className="btn-primary text-sm py-2 flex items-center gap-2 ml-auto disabled:opacity-60">
              {submitting
                ? <><Loader size={13} className="animate-spin" /> Submitting…</>
                : <><Send size={13} /> Submit Review</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}