import React, { useState, useEffect } from 'react'
import { Users, FileText, BookOpen, BarChart2 } from 'lucide-react'
import { adminApi, usersApi } from '../../services/api'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

export default function AdminOverviewPage() {
  const [stats,     setStats]     = useState(null)
  const [chartData, setChartData] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.overview().catch(() => null),
      adminApi.byMonth().catch(() => []),
    ]).then(([s, c]) => {
      setStats(s)
      setChartData(c || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Total Users',        value: stats?.users?.total        ?? '—', icon: Users    },
    { label: 'Total Manuscripts',  value: stats?.manuscripts?.total  ?? '—', icon: FileText },
    { label: 'Published Articles', value: stats?.articles?.published ?? '—', icon: BookOpen },
    { label: 'Acceptance Rate',    value: stats ? `${stats.acceptance_rate}%` : '—', icon: BarChart2 },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Overview</h1>
        <p className="text-gray-500 mt-1 text-sm">System-wide statistics at a glance.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card p-5">
              <Icon size={18} className="text-navy-600 mb-3" />
              <p className="text-2xl sm:text-3xl font-bold text-navy-900">
                {loading ? '—' : c.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      <div className="card p-5 sm:p-6 mb-6">
        <h3 className="font-bold text-navy-900 mb-5">
          Submission Trends (Last 6 Months)
        </h3>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No data yet — submissions will appear here once the journal receives manuscripts.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
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
                fill="url(#grad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Users by role */}
      {stats?.users?.by_role && (
        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-4">Users by Role</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(stats.users.by_role).map(([role, count]) => (
              <div key={role} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-navy-900">{count}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{role}s</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}