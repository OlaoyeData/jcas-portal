import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter } from 'lucide-react'
import { manuscriptsApi } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const statusConfig = {
  submitted:          { label: 'NEW',               cls: 'bg-blue-100 text-blue-800'    },
  editor_assigned:    { label: 'AWAITING REVIEWERS',cls: 'bg-yellow-100 text-yellow-800'},
  under_review:       { label: 'IN REVIEW',         cls: 'bg-blue-100 text-blue-800'    },
  revision_required:  { label: 'REVISION DUE',      cls: 'bg-red-100 text-red-700'      },
  revision_submitted: { label: 'AWAITING DECISION', cls: 'bg-green-100 text-green-800'  },
  accepted:           { label: 'ACCEPTED',           cls: 'bg-green-200 text-green-900'  },
  rejected:           { label: 'REJECTED',           cls: 'bg-red-200 text-red-800'      },
  published:          { label: 'PUBLISHED',          cls: 'bg-gray-100 text-gray-600'    },
}

export default function EditorQueuePage() {
  const { user } = useAuth()
  const basePath = (user?.role === 'editor_in_chief' || user?.role === 'admin') ? 'editor_in_chief' : 'editor'
  const [queue,       setQueue]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [searchQ,     setSearchQ]     = useState('')
  const [queueFilter, setQueueFilter] = useState('all')

  useEffect(() => {
    manuscriptsApi.listAll()
      .then(data => setQueue(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = queue.filter(s => {
    const matchSearch =
      !searchQ ||
      s.title?.toLowerCase().includes(searchQ.toLowerCase()) ||
      s.manuscript_id?.toLowerCase().includes(searchQ.toLowerCase())
    const matchFilter = queueFilter === 'all' || s.status === queueFilter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Submission Queue</h1>
        <p className="text-gray-500 mt-1 text-sm">
          All active submissions across every stage.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by title or manuscript ID…"
          className="form-input pl-9 text-sm"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-5 overflow-x-auto">
        {[
          { key: 'all',                label: 'All'                },
          { key: 'submitted',          label: 'New'                },
          { key: 'editor_assigned',    label: 'Awaiting Reviewers' },
          { key: 'under_review',       label: 'Under Review'       },
          { key: 'revision_submitted', label: 'Awaiting Decision'  },
          { key: 'revision_required',  label: 'Revision Due'       },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setQueueFilter(f.key)}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
              queueFilter === f.key
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f.label}
            <span className="ml-1 text-gray-400">
              ({queue.filter(s => f.key === 'all' || s.status === f.key).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="card p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 text-sm">
          No submissions in this category.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(sub => {
            const stCfg = statusConfig[sub.status] ||
              { label: sub.status?.replace(/_/g, ' ').toUpperCase(), cls: 'bg-gray-100 text-gray-600' }
            return (
              <div key={sub.id} className="card p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400 font-medium">
                    #{sub.manuscript_id}
                  </span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide ml-auto ${stCfg.cls}`}>
                    {stCfg.label}
                  </span>
                </div>
                <Link to={`/dashboard/${basePath}/submission/${sub.id}`}>
                  <h3 className="font-bold text-navy-900 text-sm sm:text-base leading-snug mb-1 hover:text-blue-700 transition-colors">
                    {sub.title}
                  </h3>
                </Link>
                <p className="text-xs text-gray-500 mb-3">
                  {sub.submitted_at
                    ? `Submitted: ${new Date(sub.submitted_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}`
                    : 'Not yet submitted'}
                </p>
                <div className="flex gap-2">
                  <Link
                    to={`/dashboard/${basePath}/submission/${sub.id}`}
                    className="btn-primary text-xs py-1.5 px-3"
                  >
                    {['published', 'rejected', 'desk_rejected'].includes(sub.status) ? 'View' : 'Manage'}
                  </Link>
                  {!['published', 'rejected', 'desk_rejected', 'submitted'].includes(sub.status) && (
                    <Link
                      to={`/dashboard/${basePath}/submission/${sub.id}`}
                      className="btn-outline text-xs py-1.5 px-3"
                    >
                      Make Decision
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}