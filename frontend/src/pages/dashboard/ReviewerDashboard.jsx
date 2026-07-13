import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, CheckCircle, FileText,
  AlertTriangle, ChevronRight, Users
} from 'lucide-react'
import { reviewsApi } from '../../services/api'

export default function ReviewerDashboard() {
  const [invitations,   setInvitations]   = useState([])
  const [activeReviews, setActiveReviews] = useState([])
  const [history,       setHistory]       = useState([])
  const [loading,       setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      reviewsApi.myInvitations().catch(() => []),
      reviewsApi.myActive().catch(() => []),
      reviewsApi.myHistory().catch(() => []),
    ]).then(([inv, active, hist]) => {
      setInvitations(inv    || [])
      setActiveReviews(active || [])
      setHistory(hist   || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  const cards = [
    {
      label:  'Pending Invitations',
      value:  invitations.length,
      icon:   AlertTriangle,
      color:  'text-orange-500',
      bg:     'bg-orange-50',
      link:   '/dashboard/reviewer/invitations',
      urgent: invitations.length > 0,
    },
    {
      label:  'Active Reviews',
      value:  activeReviews.length,
      icon:   FileText,
      color:  'text-blue-500',
      bg:     'bg-blue-50',
      link:   '/dashboard/reviewer/active',
      urgent: false,
    },
    {
      label:  'Completed Reviews',
      value:  history.length,
      icon:   CheckCircle,
      color:  'text-green-500',
      bg:     'bg-green-50',
      link:   '/dashboard/reviewer/history',
      urgent: false,
    },
    {
      label:  'Avg. Turnaround',
      value:  '—',
      icon:   Clock,
      color:  'text-gray-500',
      bg:     'bg-gray-50',
      link:   null,
      urgent: false,
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
          Reviewer Dashboard
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Welcome back. Here is your review activity at a glance.
        </p>
      </div>

      {/* Urgent banner */}
      {!loading && invitations.length > 0 && (
        <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800">
                You have {invitations.length} pending review invitation{invitations.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-orange-600 mt-0.5">
                Please respond to avoid delays in the editorial process.
              </p>
            </div>
          </div>
          <Link
            to="/dashboard/reviewer/invitations"
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition-colors self-start sm:self-auto flex-shrink-0"
          >
            View Invitations <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {cards.map(c => {
          const Icon = c.icon
          const inner = (
            <div className={`card p-4 sm:p-5 ${c.urgent ? 'border-orange-300 border-2' : ''} ${c.link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={c.color} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-navy-900">
                {loading ? '—' : c.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{c.label}</p>
              {c.link && (
                <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${c.color}`}>
                  View all <ChevronRight size={11} />
                </p>
              )}
            </div>
          )
          return c.link ? (
            <Link key={c.label} to={c.link}>{inner}</Link>
          ) : (
            <div key={c.label}>{inner}</div>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/dashboard/reviewer/invitations"
          className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Users size={18} className="text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Invitations</p>
              <p className="text-xs text-gray-500">Accept or decline review requests</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>

        <Link
          to="/dashboard/reviewer/active"
          className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Active Reviews</p>
              <p className="text-xs text-gray-500">Continue your in-progress reviews</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>

        <Link
          to="/dashboard/reviewer/history"
          className="card p-5 hover:shadow-md transition-shadow flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">Review History</p>
              <p className="text-xs text-gray-500">View your completed reviews</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
        </Link>
      </div>

    </div>
  )
}