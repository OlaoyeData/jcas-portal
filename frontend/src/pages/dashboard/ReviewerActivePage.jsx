import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Clock, CheckCircle } from 'lucide-react'
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

export default function ReviewerActivePage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reviewsApi.myActive()
      .then(data => setReviews(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Active Reviews
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manuscripts you are currently reviewing.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : reviews.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No active reviews</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Accept a review invitation to get started.
          </p>
          <Link
            to="/dashboard/reviewer/invitations"
            className="btn-primary text-sm mt-5 inline-flex"
          >
            View Invitations
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(rev => {
            const progress = rev.review ? 75 : 25
            return (
              <div key={rev.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium mb-1">
                      Assignment #{rev.id} · Peer Review Stage
                    </p>
                    <h3 className="font-semibold text-navy-900 text-sm sm:text-base">
                      Manuscript #{rev.manuscript_id}
                    </h3>
                  </div>
                  <CountdownBadge deadline={rev.deadline} />
                </div>

                {rev.deadline && (
                  <p className="text-xs text-gray-500 mb-4">
                    Review Deadline:{' '}
                    {new Date(rev.deadline).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}

                {/* Progress */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-navy-900 rounded-full h-2 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{progress}% complete</span>
                </div>

                {/* Criteria checklist */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  {[
                    { label: 'Originality',  done: rev.review?.score_originality != null },
                    { label: 'Methodology',  done: rev.review?.score_technical   != null },
                    { label: 'Clarity',      done: rev.review?.score_clarity     != null },
                    { label: 'Significance', done: rev.review?.score_references  != null },
                  ].map(c => (
                    <div key={c.label} className={`flex items-center gap-1.5 text-xs px-2 py-1.5 rounded-lg border ${
                      c.done ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}>
                      {c.done
                        ? <CheckCircle size={11} className="text-green-600 flex-shrink-0" />
                        : <div className="w-2.5 h-2.5 rounded-full border border-gray-400 flex-shrink-0" />
                      }
                      {c.label}
                    </div>
                  ))}
                </div>

                <Link
                  to={`/dashboard/reviewer/review/${rev.id}`}
                  className="btn-primary text-sm py-2 flex items-center gap-2 w-fit"
                >
                  <FileText size={14} />
                  {rev.review ? 'Continue Review' : 'Start Review'}
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}