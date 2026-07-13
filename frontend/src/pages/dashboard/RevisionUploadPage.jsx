import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft, Upload, FileText, X,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react'
import { manuscriptsApi } from '../../services/api'

export default function RevisionUploadPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [manuscript, setManuscript] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revisedFile, setRevisedFile] = useState(null)
  const [responseFile, setResponseFile] = useState(null)
  const [coverNote, setCoverNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    manuscriptsApi.get(id)
      .then(data => {
        if (data.status !== 'revision_required') {
          navigate(`/dashboard/author/manuscript/${id}`)
          return
        }
        setManuscript(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async () => {
    if (!revisedFile) {
      alert('Please upload the revised manuscript file.')
      return
    }
    setSubmitting(true)
    try {
      if (revisedFile)  await manuscriptsApi.uploadFile(id, revisedFile,  'revision')
      if (responseFile) await manuscriptsApi.uploadFile(id, responseFile, 'supplementary')
      await manuscriptsApi.resubmit(id)
      setSubmitted(true)
    } catch (err) {
      alert(`Submission failed: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>

  if (submitted) return (
    <div className="p-8 flex items-center justify-center min-h-96">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Revision Submitted</h2>
        <p className="text-gray-500 mb-6">Your revised manuscript has been submitted to the editor for review.</p>
        <button onClick={() => navigate('/dashboard/author')} className="btn-primary">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  // Parse reviewer comments from status history notes
  const revisionNote = manuscript?.status_history
    ?.filter(h => h.to_status === 'revision_required')
    ?.slice(-1)[0]?.note

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">

      {/* Breadcrumb */}
      <Link to={`/dashboard/author/manuscript/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
        <ChevronLeft size={15} /> Back to Manuscript
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Upload Revision</h1>
        {manuscript && (
          <p className="text-gray-500 mt-1 text-sm line-clamp-1">{manuscript.manuscript_id} — {manuscript.title}</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Editor decision + reviewer comments */}
        <div className="lg:col-span-1 space-y-4">

          {/* Revision info */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-2">
              <AlertCircle size={15} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs font-semibold text-amber-800">Revision #{(manuscript?.revision_number || 0) + 1} Required</p>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              Please address all reviewer and editor comments before resubmitting.
              Upload a response-to-reviewers document explaining how each comment was addressed.
            </p>
          </div>

          {/* Editor decision letter */}
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <FileText size={12} /> Editor Decision Letter
            </h3>
            {revisionNote ? (
              <p className="text-xs text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-3">{revisionNote}</p>
            ) : (
              <p className="text-xs text-gray-400">No decision letter available. Please check your email for the full decision letter.</p>
            )}
          </div>

          {/* Revision history */}
          {manuscript?.revision_number > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock size={12} /> Revision History
              </h3>
              <div className="space-y-2">
                {manuscript.status_history
                  ?.filter(h => h.to_status === 'revision_submitted')
                  .map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Revision {i + 1}</span>
                      <span className="text-gray-400">
                        {new Date(h.changed_at).toLocaleDateString('en-GB')}
                      </span>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* Right: Upload form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Revised manuscript */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy-900 mb-1">
              Revised Manuscript <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Upload your revised manuscript file. PDF or DOCX, max 50 MB.
            </p>
            {revisedFile ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <FileText size={16} className="text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{revisedFile.name}</p>
                  <p className="text-xs text-gray-500">{(revisedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setRevisedFile(null)} className="text-gray-400 hover:text-red-500">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-navy-400 cursor-pointer transition-colors">
                <Upload size={24} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Click to upload revised manuscript</p>
                <p className="text-xs text-gray-400 mt-1">PDF or DOCX, up to 50 MB</p>
                <input type="file" accept=".pdf,.docx" className="sr-only"
                  onChange={e => setRevisedFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Response to reviewers */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy-900 mb-1">
              Response to Reviewers <span className="text-gray-400 font-normal text-sm">(Recommended)</span>
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              A point-by-point response document significantly improves your chances of acceptance.
              Address each reviewer comment individually.
            </p>
            {responseFile ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <FileText size={16} className="text-blue-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{responseFile.name}</p>
                  <p className="text-xs text-gray-500">{(responseFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button onClick={() => setResponseFile(null)} className="text-gray-400 hover:text-red-500">
                  <X size={15} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-navy-400 cursor-pointer transition-colors">
                <Upload size={20} className="text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-600">Upload response document</p>
                <p className="text-xs text-gray-400 mt-1">PDF or DOCX</p>
                <input type="file" accept=".pdf,.docx" className="sr-only"
                  onChange={e => setResponseFile(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Cover note */}
          <div className="card p-5">
            <h3 className="font-semibold text-navy-900 mb-1">
              Cover Note to Editor <span className="text-gray-400 font-normal text-sm">(Optional)</span>
            </h3>
            <textarea
              value={coverNote}
              onChange={e => setCoverNote(e.target.value)}
              rows={4}
              placeholder="Add a brief note to the editor about the major changes made in this revision..."
              className="form-input text-sm resize-none mt-3"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Link to={`/dashboard/author/manuscript/${id}`} className="btn-outline text-sm text-center">
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={submitting || !revisedFile}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {submitting ? 'Submitting…' : <><CheckCircle size={14} /> Submit Revision</>}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}