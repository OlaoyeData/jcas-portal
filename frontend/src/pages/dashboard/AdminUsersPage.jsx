import React, { useState, useEffect } from 'react'
import { Search, Plus, Check, X, Mail, Clock, UserCheck, UserX, Loader, Send } from 'lucide-react'
import { usersApi, adminApi } from '../../services/api'

const roleCls = {
  admin:           'bg-purple-100 text-purple-800',
  editor_in_chief: 'bg-indigo-100 text-indigo-800',
  editor:          'bg-blue-100 text-blue-800',
  reviewer:        'bg-teal-100 text-teal-800',
  author:          'bg-gray-100 text-gray-700',
}

export default function AdminUsersPage() {
  const [users,          setUsers]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [userSearch,     setUserSearch]     = useState('')
  const [roleFilter,     setRoleFilter]     = useState('all')

  // Editor invitation
  const [inviteName,     setInviteName]     = useState('')
  const [inviteEmail,    setInviteEmail]    = useState('')
  const [inviteRole,     setInviteRole]     = useState('editor')
  const [inviteLoading,  setInviteLoading]  = useState(false)
  const [inviteSuccess,  setInviteSuccess]  = useState('')
  const [inviteError,    setInviteError]    = useState('')

  // Pending reviewers
  const [pendingRevs,    setPendingRevs]    = useState([])
  const [pendingLoading, setPendingLoading] = useState(true)
  const [approvingId,    setApprovingId]    = useState(null)

  useEffect(() => {
    usersApi.listAll()
      .then(data => setUsers(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))

    adminApi.pendingReviewers()
      .then(data => setPendingRevs(data || []))
      .catch(() => setPendingRevs([]))
      .finally(() => setPendingLoading(false))
  }, [])

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !userSearch ||
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const toggleStatus = async (user) => {
    const newStatus = user.is_active === false ? true : false
    try {
      await usersApi.updateUser(user.id, { is_active: newStatus })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const changeRole = async (id, newRole) => {
    try {
      await usersApi.updateUser(id, { role: newRole })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const deleteUser = async (id) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return
    try {
      await usersApi.updateUser(id, { is_active: false })
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: false } : u))
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleInviteEditor = async () => {
    setInviteError('')
    setInviteSuccess('')
    if (!inviteEmail.trim() || !inviteName.trim()) {
      setInviteError('Name and email are required.')
      return
    }
    setInviteLoading(true)
    try {
      await adminApi.inviteEditor({ email: inviteEmail.trim(), name: inviteName.trim(), role: inviteRole })
      setInviteSuccess(`Invitation sent to ${inviteEmail}. They will receive an email to set up their account.`)
      setInviteName('')
      setInviteEmail('')
    } catch (err) {
      setInviteError(err.message || 'Failed to send invitation. Please try again.')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleApproveReviewer = async (reviewer) => {
    setApprovingId(reviewer.id)
    try {
      await adminApi.approveReviewer(reviewer.id)
      setPendingRevs(prev => prev.filter(r => r.id !== reviewer.id))
      setUsers(prev => prev.map(u => u.id === reviewer.id ? { ...u, is_approved: true } : u))
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  const handleRejectReviewer = async (reviewer) => {
    if (!window.confirm(`Reject ${reviewer.name}? Their account will be deactivated.`)) return
    setApprovingId(reviewer.id)
    try {
      await adminApi.rejectReviewer(reviewer.id)
      setPendingRevs(prev => prev.filter(r => r.id !== reviewer.id))
      setUsers(prev => prev.filter(u => u.id !== reviewer.id))
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">User Management</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Invite editors, approve reviewers, and manage all registered users.
        </p>
      </div>

      {/* ── Invite Editor ─────────────────────────────────────────────── */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
          <Mail size={15} className="text-blue-600" /> Invite Editor
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Send an email invitation for a new editor or editor-in-chief to set up their account.
        </p>

        {inviteSuccess && (
          <div className="mb-3 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <Check size={14} className="mt-0.5 flex-shrink-0" /> {inviteSuccess}
          </div>
        )}
        {inviteError && (
          <div className="mb-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <X size={14} className="mt-0.5 flex-shrink-0" /> {inviteError}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <input
            type="text"
            value={inviteName}
            onChange={e => setInviteName(e.target.value)}
            placeholder="Full name"
            className="form-input text-sm"
          />
          <input
            type="email"
            value={inviteEmail}
            onChange={e => setInviteEmail(e.target.value)}
            placeholder="editor@institution.edu"
            className="form-input text-sm"
          />
          <select
            value={inviteRole}
            onChange={e => setInviteRole(e.target.value)}
            className="form-input text-sm"
          >
            <option value="editor">Editor</option>
            <option value="editor_in_chief">Editor-in-Chief</option>
          </select>
          <button
            onClick={handleInviteEditor}
            disabled={inviteLoading}
            className="btn-primary text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {inviteLoading
              ? <><Loader size={13} className="animate-spin" /> Sending…</>
              : <><Send size={13} /> Send Invitation</>
            }
          </button>
        </div>
      </div>

      {/* ── Pending Reviewer Approvals ────────────────────────────────── */}
      {(pendingLoading || pendingRevs.length > 0) && (
        <div className="card p-5 mb-5">
          <h3 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
            <Clock size={15} className="text-amber-500" /> Pending Reviewer Approvals
            {pendingRevs.length > 0 && (
              <span className="ml-1 text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingRevs.length}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Reviewers who have registered and are awaiting vetting by the editorial office.
          </p>
          {pendingLoading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Loading…</p>
          ) : (
            <div className="space-y-3">
              {pendingRevs.map(r => (
                <div key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border border-gray-100 bg-amber-50/50">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                    {r.affiliation && <p className="text-xs text-gray-400">{r.affiliation}</p>}
                    {r.expertise_areas && (
                      <p className="text-xs text-blue-600 mt-0.5">{r.expertise_areas}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveReviewer(r)}
                      disabled={approvingId === r.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                    >
                      {approvingId === r.id
                        ? <Loader size={12} className="animate-spin" />
                        : <UserCheck size={13} />
                      }
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectReviewer(r)}
                      disabled={approvingId === r.id}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
                    >
                      <UserX size={13} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
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
          className="form-input text-sm w-full sm:w-44"
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="editor_in_chief">Editor-in-Chief</option>
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
                <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading users…</td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">No users found.</td>
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
                  <select
                    value={u.role}
                    onChange={e => changeRole(u.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-navy-600 ${roleCls[u.role] || 'bg-gray-100 text-gray-600'}`}
                  >
                    <option value="author">Author</option>
                    <option value="reviewer">Reviewer</option>
                    <option value="editor">Editor</option>
                    <option value="editor_in_chief">Editor-in-Chief</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded w-fit ${u.is_active === false ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {u.is_active === false ? 'Inactive' : 'Active'}
                    </span>
                    {u.role === 'reviewer' && u.is_approved === false && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded w-fit bg-amber-100 text-amber-700">
                        Pending
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                  {u.created_at
                    ? new Date(u.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })
                    : '—'}
                </td>
                <td className="px-3 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleStatus(u)}
                      title={u.is_active === false ? 'Activate' : 'Suspend'}
                      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${u.is_active === false ? 'text-green-500' : 'text-orange-500'}`}
                    >
                      {u.is_active === false ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-3">
        Change a user's role via the dropdown. The orange button suspends an account; the green button re-activates it.
        Editor accounts must be created via invitation (above) — they cannot self-register.
      </p>
    </div>
  )
}