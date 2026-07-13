import React, { useState, useEffect } from 'react'
import {
  Users, FileText, Settings, BarChart2,
  Search, MoreVertical, Plus, Check, X,
  Megaphone, Mail, BookOpen, Save, Eye, EyeOff,
  Shield, ChevronDown, Upload, AlertCircle
} from 'lucide-react'
import { adminApi, usersApi } from '../../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAnnouncement } from '../../contexts/AnnouncementContext'
import { adminApi, usersApi } from '../../services/api'

// ── Tab config ────────────────────────────────────────────────────────────────
const adminTabs = [
  { key: 'overview',    label: 'Overview',                icon: BarChart2  },
  { key: 'users',       label: 'User Management',         icon: Users      },
  { key: 'journal',     label: 'Journal Settings',        icon: Settings   },
  { key: 'subjects',    label: 'Subject Areas',           icon: BookOpen   },
  { key: 'templates',   label: 'Email Templates',         icon: Mail       },
  { key: 'announcements',label: 'Announcements',          icon: Megaphone  },
]

// ── Role badge colours ────────────────────────────────────────────────────────
const roleCls = {
  admin:    'bg-purple-100 text-purple-800',
  editor:   'bg-blue-100 text-blue-800',
  reviewer: 'bg-teal-100 text-teal-800',
  author:   'bg-gray-100 text-gray-700',
}

const statusCls = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-red-100 text-red-700',
}

// ── Default email templates ───────────────────────────────────────────────────
const DEFAULT_TEMPLATES = {
  submission_confirmation: {
    label:   'Submission Confirmation',
    subject: 'JCAS — Manuscript Received: {manuscript_id}',
    body:
`Dear {author_name},

Thank you for submitting your manuscript "{manuscript_title}" to the Journal of Computing & Applied Sciences (JCAS).

Your Manuscript ID is: {manuscript_id}

We will assign an editor within 5 working days and keep you updated on the progress of your submission.

Best regards,
The JCAS Editorial Team`,
  },
  review_invitation: {
    label:   'Review Invitation',
    subject: 'JCAS — Invitation to Review a Manuscript',
    body:
`Dear {reviewer_name},

We would like to invite you to review the manuscript "{manuscript_title}" submitted to JCAS.

Review Deadline: {deadline}

Please log in to your reviewer dashboard to accept or decline this invitation. If you have any conflict of interest with this manuscript, please decline and let us know.

Thank you for supporting open science.

Best regards,
The JCAS Editorial Team`,
  },
  decision_notification: {
    label:   'Decision Notification',
    subject: 'JCAS — Editorial Decision for {manuscript_id}',
    body:
`Dear {author_name},

An editorial decision has been made regarding your manuscript "{manuscript_title}".

Decision: {decision}

Please log in to your author dashboard to view the full decision letter and reviewer comments.

Best regards,
The JCAS Editorial Team`,
  },
  revision_reminder: {
    label:   'Revision Reminder',
    subject: 'JCAS — Revision Reminder: {manuscript_id}',
    body:
`Dear {author_name},

This is a friendly reminder that your revised manuscript "{manuscript_title}" is due on {deadline}.

Please log in to your author dashboard to upload your revised manuscript and response-to-reviewers document.

If you require an extension, please contact the editorial office as soon as possible.

Best regards,
The JCAS Editorial Team`,
  },
}

// ── Default subjects ──────────────────────────────────────────────────────────
const DEFAULT_SUBJECTS = [
  { id: 1,  name: 'Artificial Intelligence',    slug: 'artificial-intelligence', active: true  },
  { id: 2,  name: 'Machine Learning',           slug: 'machine-learning',        active: true  },
  { id: 3,  name: 'Computer Networks',          slug: 'computer-networks',       active: true  },
  { id: 4,  name: 'Distributed Systems',        slug: 'distributed-systems',     active: true  },
  { id: 5,  name: 'Cybersecurity',              slug: 'cybersecurity',           active: true  },
  { id: 6,  name: 'Human-Computer Interaction', slug: 'hci',                     active: true  },
  { id: 7,  name: 'Quantum Computing',          slug: 'quantum-computing',       active: true  },
  { id: 8,  name: 'Database Systems',           slug: 'database-systems',        active: true  },
  { id: 9,  name: 'Software Engineering',       slug: 'software-engineering',    active: true  },
  { id: 10, name: 'Computer Vision',            slug: 'computer-vision',         active: true  },
]

// ─────────────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [tab, setTab] = useState('overview')

  // ── Overview ──────────────────────────────────────────────────────────────
  const [stats,    setStats]    = useState(null)
  const [chartData,setChartData]= useState([])

  // ── Users ─────────────────────────────────────────────────────────────────
  const [users,       setUsers]       = useState([])
  const [userSearch,  setUserSearch]  = useState('')
  const [roleFilter,  setRoleFilter]  = useState('all')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole,  setInviteRole]  = useState('author')

  // ── Journal settings ──────────────────────────────────────────────────────
  const [journalSettings, setJournalSettings] = useState({
    name:           'Journal of Computing & Applied Sciences',
    issn_online:    '2805-3516',
    issn_print:     '2006-1234',
    description:    'A peer-reviewed, open-access journal dedicated to publishing high-quality research across all domains of computer science and related applied sciences.',
    review_model:   'double_blind',
    submissions_open: true,
    allowed_file_types: 'pdf,docx,zip',
    max_upload_mb:  50,
  })
  const [journalSaved, setJournalSaved] = useState(false)

  // ── Subjects ──────────────────────────────────────────────────────────────
  const [subjects,    setSubjects]    = useState(DEFAULT_SUBJECTS)
  const [newSubject,  setNewSubject]  = useState({ name: '', slug: '' })
  const [editingSubject, setEditingSubject] = useState(null)

  // ── Email templates ───────────────────────────────────────────────────────
  const [templates,       setTemplates]       = useState(DEFAULT_TEMPLATES)
  const [activeTemplate,  setActiveTemplate]  = useState('submission_confirmation')
  const [templateSaved,   setTemplateSaved]   = useState(false)

  // ── Announcements ─────────────────────────────────────────────────────────
  const { announcement, updateAnnouncement } = useAnnouncement()
  const [annForm,   setAnnForm]   = useState(announcement)
  const [annSaved,  setAnnSaved]  = useState(false)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.overview().catch(() => null),
      adminApi.byMonth().catch(() => []),
      usersApi.listAll().catch(() => []),
    ]).then(([s, chart, u]) => {
      setStats(s)
      setChartData(chart || [])
      setUsers(u     || [])
    }).catch(console.error)
    .finally(() => setLoading(false))
  }, [])

  // ── User helpers ──────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchSearch =
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const toggleUserStatus = async (user) => {
    try {
      await usersApi.updateUser(user.id, { is_active: user.is_active === false ? true : false })
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, is_active: !u.is_active } : u
      ))
    } catch (err) { alert(`Error: ${err.message}`) }
  }

  const changeRole = async (id, newRole) => {
    try {
      await usersApi.updateUser(id, { role: newRole })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (err) { alert(`Error: ${err.message}`) }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return
    try {
      await usersApi.updateUser(id, { is_active: false })
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch (err) { alert(`Error: ${err.message}`) }
  }

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    alert(`Invitation sent to ${inviteEmail} as ${inviteRole}.`)
    setInviteEmail('')
  }

  // ── Journal helpers ───────────────────────────────────────────────────────
  const handleSaveJournal = (e) => {
    e.preventDefault()
    setJournalSaved(true)
    setTimeout(() => setJournalSaved(false), 2500)
  }

  // ── Subject helpers ───────────────────────────────────────────────────────
  const addSubject = () => {
    if (!newSubject.name.trim()) return
    setSubjects(p => [...p, { id: Date.now(), ...newSubject, active: true }])
    setNewSubject({ name: '', slug: '' })
  }

  const toggleSubject = (id) => {
    setSubjects(p => p.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const deleteSubject = (id) => {
    setSubjects(p => p.filter(s => s.id !== id))
  }

  // ── Template helpers ──────────────────────────────────────────────────────
  const handleSaveTemplate = () => {
    setTemplateSaved(true)
    setTimeout(() => setTemplateSaved(false), 2500)
  }

  const resetTemplate = () => {
    setTemplates(p => ({ ...p, [activeTemplate]: DEFAULT_TEMPLATES[activeTemplate] }))
  }

  // ── Announcement helpers ──────────────────────────────────────────────────
  const handleSaveAnnouncement = () => {
    updateAnnouncement(annForm)
    setAnnSaved(true)
    setTimeout(() => setAnnSaved(false), 2500)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Administration Panel</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage users, journal settings, subject areas, and email templates.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {adminTabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
                tab === t.key
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Total Users',        value: stats?.users?.total          ?? '—', icon: Users    },
              { label: 'Total Manuscripts',  value: stats?.manuscripts?.total    ?? '—', icon: FileText },
              { label: 'Published Articles', value: stats?.articles?.published   ?? '—', icon: BookOpen },
              { label: 'Acceptance Rate',    value: stats ? `${stats.acceptance_rate}%` : '—', icon: BarChart2 },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} className="card p-5">
                  <Icon size={18} className="text-navy-600 mb-3" />
                  <p className="text-2xl sm:text-3xl font-bold text-navy-900">
                    {loading ? '—' : s.value}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              )
            })}
          </div>

          {/* Chart */}
          <div className="card p-5 sm:p-6">
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
      )}

      {/* ── USER MANAGEMENT TAB ─────────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-5">

          {/* Invite */}
          <div className="card p-5">
            <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
              <Plus size={15} /> Invite New User
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="user@institution.edu"
                className="form-input flex-1 text-sm"
              />
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="form-input w-full sm:w-36 text-sm"
              >
                <option value="author">Author</option>
                <option value="reviewer">Reviewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={handleInvite} className="btn-primary text-sm py-2">
                Send Invite
              </button>
            </div>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search by name or email…"
                className="form-input pl-8 text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="form-input text-sm w-full sm:w-36"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="reviewer">Reviewer</option>
              <option value="author">Author</option>
            </select>
          </div>

          {/* Users table */}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Registered</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                      Loading users…
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                      No users found.
                    </td>
                  </tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {u.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      {/* Role selector */}
                      <select
                        value={u.role}
                        onChange={e => changeRole(u.id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-navy-600 ${roleCls[u.role] || 'bg-gray-100 text-gray-600'}`}
                      >
                        <option value="author">Author</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded capitalize ${
                          u.is_active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {u.is_active === false ? 'Inactive' : 'Active'}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })
                        : u.joined || '—'}
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        {/* Suspend / Activate */}
                        <button
                          onClick={() => toggleUserStatus(u)}
                          title={u.status === 'active' ? 'Suspend account' : 'Activate account'}
                          className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${
                            u.status === 'active' ? 'text-orange-500' : 'text-green-500'
                          }`}
                        >
                          {u.status === 'active'
                            ? <X size={14} />
                            : <Check size={14} />}
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => deleteUser(u.id)}
                          title="Delete account"
                          className="p-1.5 rounded hover:bg-gray-100 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <p className="text-xs text-gray-400">
            To promote or demote a user, change their role using the dropdown in the Role column.
            The orange button suspends an account. The red button permanently deletes it.
          </p>
        </div>
      )}

      {/* ── JOURNAL SETTINGS TAB ────────────────────────────────────────── */}
      {tab === 'journal' && (
        <div className="max-w-2xl space-y-5">
          <form onSubmit={handleSaveJournal} className="space-y-5">

            {/* Basic info */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100">
                Journal Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Journal Name</label>
                  <input
                    type="text"
                    value={journalSettings.name}
                    onChange={e => setJournalSettings(p => ({ ...p, name: e.target.value }))}
                    className="form-input text-sm"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">ISSN (Online)</label>
                    <input
                      type="text"
                      value={journalSettings.issn_online}
                      onChange={e => setJournalSettings(p => ({ ...p, issn_online: e.target.value }))}
                      className="form-input text-sm"
                      placeholder="0000-0000"
                    />
                  </div>
                  <div>
                    <label className="form-label">ISSN (Print)</label>
                    <input
                      type="text"
                      value={journalSettings.issn_print}
                      onChange={e => setJournalSettings(p => ({ ...p, issn_print: e.target.value }))}
                      className="form-input text-sm"
                      placeholder="0000-0000"
                    />
                  </div>
                </div>
                <div>
                  <label className="form-label">Journal Description</label>
                  <textarea
                    value={journalSettings.description}
                    rows={3}
                    onChange={e => setJournalSettings(p => ({ ...p, description: e.target.value }))}
                    className="form-input text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Cover Image <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-navy-400 cursor-pointer transition-colors">
                    <Upload size={16} className="text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-500">
                      Click to upload cover image (PNG or JPG, max 2 MB)
                    </span>
                    <input type="file" accept="image/png,image/jpeg" className="sr-only" />
                  </label>
                </div>
              </div>
            </div>

            {/* Review model */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100">
                Peer Review Model
              </h3>
              <div className="space-y-2">

                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  journalSettings.review_model === 'single_blind'
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="review_model"
                    value="single_blind"
                    checked={journalSettings.review_model === 'single_blind'}
                    onChange={() => setJournalSettings(p => ({ ...p, review_model: 'single_blind' }))}
                    className="mt-0.5 text-navy-700 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Single-Blind</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Reviewers know the authors but authors do not know the reviewers.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  journalSettings.review_model === 'double_blind'
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="review_model"
                    value="double_blind"
                    checked={journalSettings.review_model === 'double_blind'}
                    onChange={() => setJournalSettings(p => ({ ...p, review_model: 'double_blind' }))}
                    className="mt-0.5 text-navy-700 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Double-Blind</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Neither authors nor reviewers know each other. Recommended for impartial review.
                    </p>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  journalSettings.review_model === 'open'
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input
                    type="radio"
                    name="review_model"
                    value="open"
                    checked={journalSettings.review_model === 'open'}
                    onChange={() => setJournalSettings(p => ({ ...p, review_model: 'open' }))}
                    className="mt-0.5 text-navy-700 flex-shrink-0"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Open Review</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Both authors and reviewers know each other. Promotes transparency.
                    </p>
                  </div>
                </label>

              </div>
            </div>

            {/* Submission settings */}
            <div className="card p-5 sm:p-6">
              <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100">
                Submission Settings
              </h3>
              <div className="space-y-4">

                {/* Open/closed toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Submissions Open
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      When off, the Submit page shows a closed notice
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJournalSettings(p => ({ ...p, submissions_open: !p.submissions_open }))}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                      journalSettings.submissions_open ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      journalSettings.submissions_open ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Allowed File Types</label>
                    <input
                      type="text"
                      value={journalSettings.allowed_file_types}
                      onChange={e => setJournalSettings(p => ({ ...p, allowed_file_types: e.target.value }))}
                      className="form-input text-sm"
                      placeholder="pdf,docx,zip"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated extensions</p>
                  </div>
                  <div>
                    <label className="form-label">Max Upload Size (MB)</label>
                    <input
                      type="number"
                      value={journalSettings.max_upload_mb}
                      onChange={e => setJournalSettings(p => ({ ...p, max_upload_mb: Number(e.target.value) }))}
                      className="form-input text-sm"
                      min={1}
                      max={500}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary text-sm flex items-center gap-2">
                <Save size={14} /> Save Journal Settings
              </button>
              {journalSaved && (
                <p className="text-xs text-green-600 font-medium">Settings saved successfully.</p>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ── SUBJECT AREAS TAB ───────────────────────────────────────────── */}
      {tab === 'subjects' && (
        <div className="max-w-2xl space-y-5">

          {/* Add new */}
          <div className="card p-5">
            <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
              <Plus size={15} /> Add Subject Area
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <input
                type="text"
                value={newSubject.name}
                onChange={e => setNewSubject(p => ({
                  ...p,
                  name: e.target.value,
                  slug: e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[^a-z0-9-]/g, ''),
                }))}
                placeholder="Subject area name"
                className="form-input flex-1 text-sm"
                onKeyDown={e => e.key === 'Enter' && addSubject()}
              />
              <input
                type="text"
                value={newSubject.slug}
                onChange={e => setNewSubject(p => ({ ...p, slug: e.target.value }))}
                placeholder="url-slug"
                className="form-input w-full sm:w-36 text-sm font-mono"
              />
              <button onClick={addSubject} className="btn-primary text-sm py-2 flex-shrink-0">
                Add
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Subject areas appear in the submission form and search filters.
              The slug is used in URLs.
            </p>
          </div>

          {/* Subject list */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-sm">
                {subjects.length} Subject Area{subjects.length !== 1 ? 's' : ''}
              </h3>
              <span className="text-xs text-gray-400">
                {subjects.filter(s => s.active).length} active
              </span>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Slug</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">
                      {editingSubject === s.id ? (
                        <input
                          type="text"
                          defaultValue={s.name}
                          onBlur={e => {
                            setSubjects(p => p.map(x =>
                              x.id === s.id ? { ...x, name: e.target.value } : x
                            ))
                            setEditingSubject(null)
                          }}
                          autoFocus
                          className="form-input text-sm py-1"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingSubject(s.id)}
                          className="hover:text-blue-600 transition-colors text-left"
                          title="Click to edit"
                        >
                          {s.name}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500 font-mono">{s.slug}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        s.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {s.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleSubject(s.id)}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {s.active ? 'Hide' : 'Show'}
                        </button>
                        <span className="text-gray-300">·</span>
                        <button
                          onClick={() => deleteSubject(s.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── EMAIL TEMPLATES TAB ─────────────────────────────────────────── */}
      {tab === 'templates' && (
        <div className="max-w-3xl space-y-4">

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 flex items-start gap-2">
            <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              Use these placeholders in your templates:{' '}
              {['{author_name}', '{manuscript_title}', '{manuscript_id}', '{decision}', '{deadline}', '{reviewer_name}'].map(p => (
                <code key={p} className="bg-blue-100 px-1 py-0.5 rounded mx-0.5 font-mono">{p}</code>
              ))}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">

            {/* Template selector */}
            <div className="sm:col-span-1">
              <div className="card p-2 space-y-1">
                {Object.entries(templates).map(([key, tmpl]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTemplate(key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors leading-snug ${
                      activeTemplate === key
                        ? 'bg-navy-900 text-white font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tmpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="sm:col-span-3">
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-4">
                  {templates[activeTemplate].label}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Subject Line</label>
                    <input
                      type="text"
                      value={templates[activeTemplate].subject}
                      onChange={e => setTemplates(p => ({
                        ...p,
                        [activeTemplate]: { ...p[activeTemplate], subject: e.target.value }
                      }))}
                      className="form-input text-sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Email Body</label>
                    <textarea
                      rows={14}
                      value={templates[activeTemplate].body}
                      onChange={e => setTemplates(p => ({
                        ...p,
                        [activeTemplate]: { ...p[activeTemplate], body: e.target.value }
                      }))}
                      className="form-input text-sm resize-y font-mono leading-relaxed"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button
                    onClick={handleSaveTemplate}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <Save size={14} /> Save Template
                  </button>
                  <button
                    onClick={resetTemplate}
                    className="btn-outline text-sm"
                  >
                    Reset to Default
                  </button>
                  {templateSaved && (
                    <p className="text-xs text-green-600 font-medium">Template saved.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ANNOUNCEMENTS TAB ───────────────────────────────────────────── */}
      {tab === 'announcements' && (
        <div className="max-w-2xl space-y-5">

          {/* Preview */}
          <div className="card p-5">
            <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
              <Eye size={15} /> Live Preview
            </h3>
            <div className={`rounded-lg border px-4 py-3 text-sm flex items-center gap-2 flex-wrap ${
              annForm.color === 'green' ? 'bg-green-50 border-green-100 text-green-800' :
              annForm.color === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-800' :
              annForm.color === 'red'   ? 'bg-red-50 border-red-100 text-red-800'       :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}>
              <Megaphone size={14} className="flex-shrink-0" />
              <span className="font-semibold">Announcement:</span>
              <span>{annForm.text || 'Your announcement text will appear here.'}</span>
              {annForm.linkText && (
                <span className="underline font-medium">{annForm.linkText} →</span>
              )}
            </div>
            {!annForm.isActive && (
              <p className="text-xs text-gray-400 mt-2">
                Currently hidden — toggle Active to show on the home page.
              </p>
            )}
          </div>

          {/* Editor */}
          <div className="card p-5 sm:p-6">
            <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
              <Megaphone size={15} /> Announcement Settings
            </h3>
            <div className="space-y-4">

              {/* Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Show Announcement Bar</p>
                  <p className="text-xs text-gray-500 mt-0.5">Toggle visibility on the home page</p>
                </div>
                <button
                  onClick={() => setAnnForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                    annForm.isActive ? 'bg-navy-900' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    annForm.isActive ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div>
                <label className="form-label">Announcement Text</label>
                <textarea
                  rows={3}
                  value={annForm.text}
                  onChange={e => setAnnForm(p => ({ ...p, text: e.target.value }))}
                  placeholder="Enter your announcement message..."
                  className="form-input resize-none text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">
                    Link Label <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={annForm.linkText}
                    onChange={e => setAnnForm(p => ({ ...p, linkText: e.target.value }))}
                    placeholder="e.g. Submit Now"
                    className="form-input text-sm"
                  />
                </div>
                <div>
                  <label className="form-label">
                    Link URL <span className="text-gray-400 normal-case font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={annForm.linkUrl}
                    onChange={e => setAnnForm(p => ({ ...p, linkUrl: e.target.value }))}
                    placeholder="e.g. /submit/guidelines"
                    className="form-input text-sm"
                  />
                </div>
              </div>

              {/* Colour picker */}
              <div>
                <label className="form-label">Bar Colour</label>
                <div className="flex gap-3 mt-1">
                  {[
                    { key: 'blue',  label: 'Blue',  cls: 'bg-blue-500'  },
                    { key: 'green', label: 'Green', cls: 'bg-green-500' },
                    { key: 'amber', label: 'Amber', cls: 'bg-amber-500' },
                    { key: 'red',   label: 'Red',   cls: 'bg-red-500'   },
                  ].map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setAnnForm(p => ({ ...p, color: c.key }))}
                      title={c.label}
                      className={`w-8 h-8 rounded-full ${c.cls} transition-all ${
                        annForm.color === c.key
                          ? 'ring-2 ring-offset-2 ring-navy-900 scale-110'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Save */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSaveAnnouncement}
                  className="btn-primary text-sm flex items-center gap-2"
                >
                  <Save size={14} />
                  {annSaved ? 'Saved!' : 'Save Changes'}
                </button>
                {annSaved && (
                  <p className="text-xs text-green-600 font-medium">
                    Announcement updated on the home page.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}