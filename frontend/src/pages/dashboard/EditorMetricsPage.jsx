import React, { useState, useEffect } from 'react'
import { BarChart2, Clock, TrendingUp, FileText } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts'
import { adminApi, manuscriptsApi } from '../../services/api'

export default function EditorMetricsPage() {
  const [stats,    setStats]    = useState(null)
  const [chart,    setChart]    = useState([])
  const [queue,    setQueue]    = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.overview().catch(() => null),
      adminApi.byMonth().catch(() => []),
      manuscriptsApi.listAll().catch(() => []),
    ]).then(([s, c, ms]) => {
      setStats(s)
      setChart(c  || [])
      setQueue(ms || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const totalSubmissions   = queue.length
  const thisMonth          = queue.filter(m => {
    if (!m.submitted_at) return false
    const d = new Date(m.submitted_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const decided            = queue.filter(m =>
    ['accepted', 'rejected', 'published'].includes(m.status)
  ).length
  const accepted           = queue.filter(m =>
    ['accepted', 'published'].includes(m.status)
  ).length
  const acceptanceRate     = decided > 0
    ? Math.round((accepted / decided) * 100) + '%'
    : '—'

  const metricCards = [
    { label: 'Total Submissions',       value: totalSubmissions,        icon: FileText,   color: 'text-blue-500'   },
    { label: 'Submissions This Month',  value: thisMonth,               icon: TrendingUp, color: 'text-green-500'  },
    { label: 'Avg. Days to Decision',   value: stats?.avg_decision_days
        ? `${stats.avg_decision_days}d` : '—',                          icon: Clock,      color: 'text-orange-500' },
    { label: 'Acceptance Rate',         value: acceptanceRate,          icon: BarChart2,  color: 'text-navy-600'   },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Editor Metrics</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Submission and review performance overview.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {metricCards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card p-5">
              <Icon size={18} className={c.color + ' mb-3'} />
              <p className="text-2xl sm:text-3xl font-bold text-navy-900">
                {loading ? '—' : c.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          )
        })}
      </div>

      {/* Submissions chart */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-navy-900 mb-5">
          Submissions Per Month (Last 6 Months)
        </h3>
        {chart.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No submission data yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chart} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="subGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1E3A8A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E3A8A" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: '8px', border: '1px solid #E5E7EB' }} />
              <Area
                type="monotone"
                dataKey="submissions"
                name="Submissions"
                stroke="#1E3A8A"
                fill="url(#subGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Status breakdown */}
      <div className="card p-5">
        <h3 className="font-bold text-navy-900 mb-4">Submissions by Status</h3>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading…</p>
        ) : (
          <div className="space-y-2">
            {[
              { label: 'Draft',             key: 'draft'             },
              { label: 'Submitted',         key: 'submitted'         },
              { label: 'Editor Assigned',   key: 'editor_assigned'   },
              { label: 'Under Review',      key: 'under_review'      },
              { label: 'Revision Required', key: 'revision_required' },
              { label: 'Accepted',          key: 'accepted'          },
              { label: 'Published',         key: 'published'         },
              { label: 'Rejected',          key: 'rejected'          },
            ].map(s => {
              const count = queue.filter(m => m.status === s.key).length
              const pct   = totalSubmissions > 0
                ? Math.round((count / totalSubmissions) * 100)
                : 0
              return (
                <div key={s.key} className="flex items-center gap-3 text-sm">
                  <span className="w-36 text-gray-600 flex-shrink-0 text-xs">
                    {s.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-navy-900 rounded-full h-2 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                    {count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}