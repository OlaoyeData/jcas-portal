import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Users, CheckCircle, AlertCircle, FileText } from 'lucide-react'
import { manuscriptsApi } from '../../services/api'

function daysAgo(dateStr) {
  if (!dateStr) return null
  return Math.floor((new Date() - new Date(dateStr)) / 86400000)
}

export default function AuthorReviewsPage() {
  const [manuscripts, setManuscripts] = useState([])
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    manuscriptsApi.listMine()
      .then(data => {
        const underReview = (data || []).filter(m =>
          ['under_review', 'revision_required', 'revision_submitted'].includes(m.status)
        )
        setManuscripts(underReview)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statusConfig = {
    under_review:       { label: 'UNDER REVIEW',       cls: 'bg-yellow-100 text-yellow-700', icon: Clock       },
    revision_required:  { label: 'REVISION REQUESTED', cls: 'bg-red-100 text-red-700',       icon: AlertCircle },
    revision_submitted: { label: 'REVISION SUBMITTED', cls: 'bg-orange-100 text-orange-700', icon: FileText    },
  }

  const counts = {
    under_review:       manuscripts.filter(m => m.status === 'under_review').length,
    revision_required:  manuscripts.filter(m => m.status === 'revision_required').length,
    revision_submitted: manuscripts.filter(m => m.status === 'revision_submitted').length,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Peer Review</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manuscripts currently in the review process.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        {[
          { label: 'Under Review',       value: counts.under_review,       icon: Clock,        color: 'text-yellow-500' },
          { label: 'Revision Requested', value: counts.revision_required,  icon: AlertCircle,  color: 'text-red-500'    },
          { label: 'Revision Submitted', value: counts.revision_submitted, icon: CheckCircle,  color: 'text-orange-500' },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-5">
              <Icon size={18} className={s.color + ' mb-3'} />
              <p className="text-3xl font-bold text-navy-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Manuscripts list */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">
          Loading…
        </div>
      ) : manuscripts.length === 0 ? (
        <div className="card p-12 text-center">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">
            No manuscripts currently under review
          </h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Once you submit a manuscript and it is sent to peer reviewers,
            it will appear here.
          </p>
          <Link
            to="/dashboard/author/submit"
            className="btn-primary text-sm mt-5 inline-flex"
          >
            Submit a Manuscript
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {manuscripts.map(ms => {
            const cfg  = statusConfig[ms.status]
            const Icon = cfg.icon
            const days = daysAgo(ms.submitted_at)

            return (
              <div key={ms.id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">

                  {/* Left: manuscript info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg.cls}`}>
                        <Icon size={11} /> {cfg.label}
                      </span>
                      <span className="text-xs text-gray-400">
                        {ms.manuscript_id}
                      </span>
                    </div>

                    <Link to={`/dashboard/author/manuscript/${ms.id}`}>
                      <h3 className="font-semibold text-navy-900 hover:text-blue-700 transition-colors leading-snug text-sm sm:text-base">
                        {ms.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-gray-500 mt-1">
                      {ms.article_type}
                      {ms.subject_area ? ` · ${ms.subject_area}` : ''}
                    </p>
                  </div>

                  {/* Right: actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      to={`/dashboard/author/manuscript/${ms.id}`}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      View Details
                    </Link>
                    {ms.status === 'revision_required' && (
                      <Link
                        to={`/dashboard/author/manuscript/${ms.id}/revise`}
                        className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-md font-semibold hover:bg-red-700 transition-colors"
                      >
                        Upload Revision
                      </Link>
                    )}
                  </div>
                </div>

                {/* Progress info */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Submitted</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {ms.submitted_at
                        ? new Date(ms.submitted_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Days in Review</p>
                    <p className="text-xs font-semibold text-gray-700">
                      {days !== null ? `${days} day${days !== 1 ? 's' : ''}` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Revision Round</p>
                    <p className="text-xs font-semibold text-gray-700">
                      Round {ms.revision_number + 1}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Article Type</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">
                      {ms.article_type}
                    </p>
                  </div>
                </div>

                {/* Revision required notice */}
                {ms.status === 'revision_required' && (
                  <div className="mt-3 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
                    <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-700 leading-relaxed">
                      The editor has requested revisions. Please check the manuscript
                      detail page for reviewer comments and upload your revised manuscript.
                    </p>
                  </div>
                )}

                {/* Revision submitted notice */}
                {ms.status === 'revision_submitted' && (
                  <div className="mt-3 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2.5 flex items-start gap-2">
                    <CheckCircle size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-orange-700 leading-relaxed">
                      Your revision has been submitted and is awaiting editorial review.
                      No action required at this time.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      {manuscripts.length > 0 && (
        <div className="mt-6 card p-4 bg-blue-50 border-blue-100">
          <div className="flex items-start gap-3">
            <Users size={15} className="text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-blue-800 mb-0.5">
                About the Peer Review Process
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                JCAS uses double-blind peer review. Reviewer identities and comments
                are confidential until the editor sends the official decision letter.
                Once a decision is made it will appear in the manuscript detail page
                under Editorial Correspondence.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}