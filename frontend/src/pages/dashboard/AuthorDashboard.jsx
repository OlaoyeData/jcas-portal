import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, Clock, AlertCircle, CheckCircle,
  Plus, Filter, MoreHorizontal, Upload
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { manuscriptsApi, notificationsApi, paymentsApi } from '../../services/api'

const STATUS_CONFIG = {
  draft:              { label: 'DRAFT',              cls: 'bg-gray-100 text-gray-600' },
  submitted:          { label: 'SUBMITTED',          cls: 'bg-blue-100 text-blue-700' },
  editor_assigned:    { label: 'EDITOR ASSIGNED',    cls: 'bg-purple-100 text-purple-700' },
  under_review:       { label: 'UNDER REVIEW',       cls: 'bg-yellow-100 text-yellow-700' },
  revision_required:  { label: 'REVISION REQUESTED', cls: 'bg-red-100 text-red-700' },
  revision_submitted: { label: 'REVISION SUBMITTED', cls: 'bg-orange-100 text-orange-700' },
  accepted:           { label: 'ACCEPTED',           cls: 'bg-green-100 text-green-700' },
  awaiting_payment:   { label: 'AWAITING PAYMENT',   cls: 'bg-amber-100 text-amber-700' },
  desk_rejected:      { label: 'DESK REJECTED',      cls: 'bg-red-200 text-red-800'     },
  published:          { label: 'PUBLISHED',          cls: 'bg-green-200 text-green-800' },
  rejected:           { label: 'REJECTED',           cls: 'bg-red-200 text-red-800' },
  withdrawn:          { label: 'WITHDRAWN',          cls: 'bg-gray-200 text-gray-600' },
}

// Workflow progress steps
const WORKFLOW = ['submitted','editor_assigned','under_review','accepted','awaiting_payment','published']

function WorkflowBar({ status }) {
  const idx = WORKFLOW.indexOf(status)
  if (idx === -1) return null
  return (
    <div className="flex items-center gap-1 mt-2">
      {WORKFLOW.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`h-1.5 w-8 sm:w-12 rounded-full ${i <= idx ? 'bg-navy-900' : 'bg-gray-200'}`} />
        </div>
      ))}
      <span className="text-xs text-gray-400 ml-1 hidden sm:inline">
        {STATUS_CONFIG[status]?.label}
      </span>
    </div>
  )
}

export default function AuthorDashboard() {
  const { user } = useAuth()
  const [manuscripts, setManuscripts] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [paymentsMap, setPaymentsMap] = useState({})

  

  useEffect(() => {
    Promise.all([
      manuscriptsApi.listMine(),
      notificationsApi.list(),
    ]).then(([ms, notifs]) => {
      setManuscripts(ms || [])
      setNotifications(notifs || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
paymentsApi.my()
  .then(pays => {
    const map = {}
    ;(pays || []).forEach(p => { map[`${p.manuscript_id}:${p.payment_type || 'publication'}`] = p })
    setPaymentsMap(map)
  })
  .catch(() => {})
}, [])

  const published    = manuscripts.filter(m => m.status === 'published').length
  const underReview  = manuscripts.filter(m => m.status === 'under_review').length
  const actionNeeded = manuscripts.filter(m => m.status === 'revision_required').length
  const accepted     = manuscripts.filter(m => m.status === 'accepted').length

  const statsCards = [
    { label: 'TOTAL SUBMISSIONS', value: manuscripts.length,  sub: 'All time',                    icon: FileText,     highlight: false },
    { label: 'UNDER REVIEW',      value: underReview,         sub: 'Awaiting reviewer feedback',  icon: Clock,        highlight: false },
    { label: 'ACTION REQUIRED',   value: actionNeeded,        sub: actionNeeded ? 'Revisions due' : 'None pending', icon: AlertCircle, highlight: actionNeeded > 0 },
    { label: 'PUBLISHED',         value: published,           sub: 'Available on Open Access',    icon: CheckCircle,  highlight: false },
  ]

  const revisionNeeded = manuscripts.filter(m => m.status === 'revision_required')

  const filtered = filterStatus === 'all'
    ? manuscripts
    : manuscripts.filter(m => m.status === filterStatus)

  const activityDotColor = {
    revision_required: 'bg-red-500',
    editor_assigned:   'bg-blue-500',
    submitted:         'bg-gray-400',
    accepted:          'bg-green-500',
    published:         'bg-green-600',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Track your manuscript lifecycle and editorial feedback.</p>
        </div>
        <Link to="/dashboard/author/submit" className="btn-primary self-start text-sm">
          <Plus size={15} /> New Submission
        </Link>
      </div>

      {/* Revision alert banner */}
      {revisionNeeded.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                {revisionNeeded.length} manuscript{revisionNeeded.length > 1 ? 's require' : ' requires'} revision
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Please address reviewer comments and upload your revised manuscript.
              </p>
            </div>
          </div>
          <Link to={`/dashboard/author/manuscript/${revisionNeeded[0].id}/revise`}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors self-start sm:self-auto flex-shrink-0">
            <Upload size={14} /> Upload Revision
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {statsCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`card p-4 sm:p-5 ${card.highlight ? 'border-red-400 border-2' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{card.label}</p>
                <Icon size={15} className={card.highlight ? 'text-red-500' : 'text-gray-400'} />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-navy-900">{card.value}</p>
              <p className={`text-xs mt-1.5 ${card.highlight ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Submissions table */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-navy-900">My Submissions</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><Filter size={15} /></button>
                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><MoreHorizontal size={15} /></button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-0 border-b border-gray-100 overflow-x-auto px-4 sm:px-5">
              {[
                { key: 'all',              label: 'All' },
                { key: 'under_review',     label: 'Under Review' },
                { key: 'revision_required',label: 'Revision' },
                { key: 'published',        label: 'Published' },
              ].map(f => (
                <button key={f.key} onClick={() => setFilterStatus(f.key)}
                  className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
                    filterStatus === f.key
                      ? 'border-navy-900 text-navy-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}>
                  {f.label}
                  {f.key !== 'all' && (
                    <span className="ml-1 text-gray-400">
                      ({manuscripts.filter(m => m.status === f.key).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 px-4 sm:px-5 py-3">Manuscript</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3 whitespace-nowrap">Date</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                    <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">Loading…</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-400 text-sm">
                        {filterStatus === 'all'
                          ? 'No submissions yet. Click "+ New Submission" to get started.'
                          : 'No manuscripts with this status.'}
                      </td>
                    </tr>
                  ) : filtered.map(ms => {
                    const cfg = STATUS_CONFIG[ms.status] || { label: ms.status, cls: 'bg-gray-100 text-gray-600' }
                    return (
                      <tr key={ms.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 sm:px-5 py-4">
                          <p className="font-semibold text-navy-900 text-sm leading-snug mb-0.5 line-clamp-2">{ms.title}</p>
                          <p className="text-xs text-gray-400">{ms.manuscript_id}</p>
                          <WorkflowBar status={ms.status} />
                        </td>
                        <td className="px-3 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(ms.submitted_at || ms.created_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
                        </td>
                        <td className="px-3 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg.cls}`}>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col gap-1">
                            {(ms.status === 'accepted' || ms.status === 'awaiting_payment') &&
                              paymentsMap[`${ms.id}:publication`]?.status !== 'confirmed' ? (
                                <Link to={`/dashboard/manuscript/${ms.id}/payment?type=publication`}
                                  className="text-xs text-green-700 hover:underline font-semibold whitespace-nowrap">
                                  {paymentsMap[`${ms.id}:publication`]?.status === 'submitted' ? 'View Payment Status' : 'Make Payment →'}
                                </Link>
                              ) : (
                              <Link to={`/dashboard/author/manuscript/${ms.id}`}
                                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap">
                                View Details
                              </Link>
                            )}
                            {ms.status !== 'draft' && paymentsMap[`${ms.id}:assessment`]?.status !== 'confirmed' && (
                              <Link to={`/dashboard/manuscript/${ms.id}/payment?type=assessment`}
                                className="text-xs text-amber-700 hover:underline font-semibold whitespace-nowrap">
                                {paymentsMap[`${ms.id}:assessment`]?.status === 'submitted'
                                  ? 'Assessment Fee: Awaiting Confirmation'
                                  : 'Pay Assessment Fee (₦5,000) →'}
                              </Link>
                            )}
                            {ms.status === 'revision_required' && (
                              <Link to={`/dashboard/author/manuscript/${ms.id}/revise`}
                                className="text-xs text-red-600 hover:underline font-medium whitespace-nowrap">
                                Upload Revision
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-5">

          {/* Recent Activity */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold text-navy-900 mb-4">Recent Activity</h2>
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-400">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {notifications.slice(0, 5).map(n => (
                  <div key={n.id} className="flex gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${n.is_read ? 'bg-gray-300' : 'bg-red-500'}`} />
                    <div>
                      <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                      <p className="text-sm font-semibold text-gray-800 mt-0.5">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Review Timeline */}
          {manuscripts.filter(m => m.status === 'under_review').length > 0 && (
            <div className="card p-4 sm:p-5">
              <h2 className="font-bold text-navy-900 mb-1">Active Review Timeline</h2>
              {manuscripts.filter(m => m.status === 'under_review').map(ms => (
                <div key={ms.id} className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">{ms.manuscript_id}</p>
                  <p className="text-xs font-medium text-gray-700 mb-3 line-clamp-1">{ms.title}</p>
                  <div className="flex items-center gap-1">
                    {['SUBMITTED','REVIEW','DECISION','PUBLISHED'].map((stage, i) => (
                      <React.Fragment key={stage}>
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center ${
                            i < 2 ? 'bg-navy-900 border-navy-900' : 'border-gray-300 bg-white'
                          }`}>
                            {i < 2 && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <p className="text-[8px] sm:text-[9px] text-gray-500 mt-1 whitespace-nowrap font-medium">{stage}</p>
                        </div>
                        {i < 3 && <div className={`flex-1 h-0.5 mb-4 ${i < 1 ? 'bg-navy-900' : 'bg-gray-200'}`} />}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}