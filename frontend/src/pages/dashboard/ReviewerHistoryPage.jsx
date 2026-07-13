import React, { useEffect, useState } from 'react'
import { BookOpen, CheckCircle } from 'lucide-react'
import { reviewsApi } from '../../services/api'

export default function ReviewerHistoryPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reviewsApi.myHistory()
      .then(data => setHistory(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Review History
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          All peer reviews you have completed.
        </p>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : history.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-gray-700 mb-1">No completed reviews yet</p>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Your completed review reports will appear here.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">
                  Manuscript
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">
                  Completed
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">
                  Scores
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">
                  Recommendation
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">
                  Report
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map(h => (
                <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-navy-900">
                      Manuscript #{h.manuscript_id}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Assignment #{h.id}
                    </p>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {h.completed_at
                      ? new Date(h.completed_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-4">
                    {h.review ? (
                      <div className="flex gap-1">
                        {[
                          h.review.score_originality,
                          h.review.score_technical,
                          h.review.score_clarity,
                          h.review.score_references,
                        ].map((s, i) => (
                          <span key={i} className="text-xs bg-navy-50 text-navy-700 w-6 h-6 rounded flex items-center justify-center font-semibold">
                            {s ?? '—'}
                          </span>
                        ))}
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-4">
                    {h.review?.recommendation ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        h.review.recommendation === 'accept'
                          ? 'bg-green-100 text-green-700'
                          : h.review.recommendation === 'minor_revision'
                          ? 'bg-blue-100 text-blue-700'
                          : h.review.recommendation === 'major_revision'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {h.review.recommendation
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, c => c.toUpperCase())}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-4">
                    <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                      <BookOpen size={12} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {history.length > 0 && (
        <div className="mt-5 card p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center gap-3">
            <CheckCircle size={16} className="text-blue-600 flex-shrink-0" />
            <p className="text-xs text-blue-800">
              You have completed <strong>{history.length}</strong> peer review{history.length !== 1 ? 's' : ''}.
              Thank you for your contribution to the journal.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}