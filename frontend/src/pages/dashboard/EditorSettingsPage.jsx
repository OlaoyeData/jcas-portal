import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Save, User, Bell, Shield, Settings, Eye, EyeOff } from 'lucide-react'
import { usersApi, reviewsApi } from '../../services/api'

export default function EditorSettingsPage() {
  const { user } = useAuth()

  const [profileForm, setProfileForm] = useState({
    name:        user?.name        || '',
    affiliation: user?.affiliation || '',
    orcid:       user?.orcid       || '',
    bio:         user?.bio         || '',
  })

  const [editorPrefs, setEditorPrefs] = useState({
    default_review_deadline:   21,
    min_reviewers_per_paper:   2,
    auto_reminder_days:        7,
  })

  const [notifPrefs, setNotifPrefs] = useState({
    notify_on_submission:      user?.notification_preferences?.notify_on_submission      ?? true,
    notify_on_review_complete: user?.notification_preferences?.notify_on_review_complete ?? true,
    notify_on_overdue:         user?.notification_preferences?.notify_on_overdue         ?? true,
  })
  const [overdueStatus, setOverdueStatus] = useState('')

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password:     '',
    confirm:          '',
  })

  const [showPw,    setShowPw]    = useState(false)
  const [savedMsg,  setSavedMsg]  = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { key: 'profile',       label: 'Profile',            icon: User     },
    { key: 'editorial',     label: 'Editorial Defaults', icon: Settings },
    { key: 'notifications', label: 'Notifications',      icon: Bell     },
    { key: 'security',      label: 'Security',           icon: Shield   },
  ]

  const showSaved = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      await usersApi.updateMe({
        name:        profileForm.name,
        affiliation: profileForm.affiliation,
        orcid:       profileForm.orcid,
        bio:         profileForm.bio,
      })
      showSaved('Profile updated successfully.')
    } catch (err) {
      showSaved(`Error: ${err.message}`)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      await usersApi.updateMe({ notification_preferences: notifPrefs })
      showSaved('Notification preferences saved.')
    } catch (err) {
      showSaved(`Error: ${err.message}`)
    }
  }

  const handleCheckOverdue = async () => {
    setOverdueStatus('Checking…')
    try {
      const res = await reviewsApi.notifyOverdue()
      setOverdueStatus(res.detail)
    } catch (err) {
      setOverdueStatus(`Error: ${err.message}`)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm) {
      showSaved('New passwords do not match.'); return
    }
    if (passwordForm.new_password.length < 8) {
      showSaved('Password must be at least 8 characters.'); return
    }
    if (!/[a-zA-Z]/.test(passwordForm.new_password) || !/[0-9]/.test(passwordForm.new_password)) {
      showSaved('Password must contain both letters and numbers.'); return
    }
    try {
      await usersApi.changePassword(passwordForm.current_password, passwordForm.new_password)
      showSaved('Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      showSaved(`Error: ${err.message}`)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your editor profile and editorial defaults.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === t.key
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Saved message */}
      {savedMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
          savedMsg.startsWith('Error') || savedMsg.includes('match') || savedMsg.includes('must')
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {savedMsg}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-navy-900 pb-3 border-b border-gray-100">
            Profile Information
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-navy-900 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
              <p className="text-xs text-gray-500">Editor · {user?.email}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" value={profileForm.name}
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Affiliation</label>
              <input type="text" value={profileForm.affiliation}
                onChange={e => setProfileForm(p => ({ ...p, affiliation: e.target.value }))}
                className="form-input text-sm" />
            </div>
          </div>
          <div>
            <label className="form-label">ORCID</label>
            <input type="text" value={profileForm.orcid}
              onChange={e => setProfileForm(p => ({ ...p, orcid: e.target.value }))}
              className="form-input text-sm" placeholder="0000-0000-0000-0000" />
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea value={profileForm.bio} rows={3}
              onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
              className="form-input text-sm resize-none" />
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Save Profile
          </button>
        </form>
      )}

      {/* Editorial Defaults Tab */}
      {activeTab === 'editorial' && (
        <form onSubmit={e => { e.preventDefault(); showSaved('Editorial defaults saved.') }}
          className="card p-5 sm:p-6 space-y-5">
          <h3 className="font-bold text-navy-900 pb-3 border-b border-gray-100">
            Editorial Defaults
          </h3>
          <p className="text-xs text-gray-500">
            These values are used as defaults when you assign reviewers and manage submissions.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Default Review Deadline (days)</label>
              <select value={editorPrefs.default_review_deadline}
                onChange={e => setEditorPrefs(p => ({ ...p, default_review_deadline: Number(e.target.value) }))}
                className="form-input text-sm">
                {[14, 21, 28, 42].map(n => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Min. Reviewers Per Manuscript</label>
              <select value={editorPrefs.min_reviewers_per_paper}
                onChange={e => setEditorPrefs(p => ({ ...p, min_reviewers_per_paper: Number(e.target.value) }))}
                className="form-input text-sm">
                {[1, 2, 3, 4].map(n => (
                  <option key={n} value={n}>{n} reviewer{n > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Auto-Reminder Before Deadline (days)</label>
              <select value={editorPrefs.auto_reminder_days}
                onChange={e => setEditorPrefs(p => ({ ...p, auto_reminder_days: Number(e.target.value) }))}
                className="form-input text-sm">
                {[3, 5, 7, 10, 14].map(n => (
                  <option key={n} value={n}>{n} days before</option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Save Defaults
          </button>
        </form>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-navy-900 pb-3 border-b border-gray-100 mb-4">
            Email Notifications
          </h3>
          <div className="space-y-4">
            {[
              { key: 'notify_on_submission',      label: 'New Submissions',    desc: 'Email me when a new manuscript is submitted and awaiting screening' },
              { key: 'notify_on_review_complete', label: 'Review Completed',   desc: 'Email me when a reviewer submits their review report'               },
              { key: 'notify_on_overdue',         label: 'Overdue Reviews',    desc: 'Allow overdue-review summary emails (sent when you check below)'    },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <button type="button"
                  onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    notifPrefs[n.key] ? 'bg-navy-900' : 'bg-gray-300'
                  }`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    notifPrefs[n.key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 mt-4">
            <button onClick={handleSaveNotifications}
              className="btn-primary text-sm flex items-center gap-2">
              <Save size={14} /> Save Preferences
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4">
            <p className="text-sm font-semibold text-gray-800 mb-1">Overdue Reviews</p>
            <p className="text-xs text-gray-500 mb-3">
              There's no automatic daily check yet — click below any time to email yourself a summary
              of reviews currently past their deadline (only sends if the toggle above is on).
            </p>
            <button onClick={handleCheckOverdue}
              className="text-sm font-medium text-navy-700 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">
              Check Overdue Reviews Now
            </button>
            {overdueStatus && <p className="text-xs text-gray-500 mt-2">{overdueStatus}</p>}
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <form onSubmit={handleSavePassword} className="card p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-navy-900 pb-3 border-b border-gray-100">
            Change Password
          </h3>
          <div>
            <label className="form-label">Current Password</label>
            <input type="password" value={passwordForm.current_password}
              onChange={e => setPasswordForm(p => ({ ...p, current_password: e.target.value }))}
              className="form-input text-sm" placeholder="Enter current password" />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={passwordForm.new_password}
                onChange={e => setPasswordForm(p => ({ ...p, new_password: e.target.value }))}
                className="form-input text-sm pr-10" placeholder="Min. 8 characters with letters and numbers" />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" value={passwordForm.confirm}
              onChange={e => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
              className="form-input text-sm" placeholder="Repeat new password" />
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Update Password
          </button>
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500">
              Your account email is <strong>{user?.email}</strong>.
              Contact the system administrator to change your email.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}