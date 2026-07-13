import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Save, User, Bell, Shield, BookOpen, Eye, EyeOff } from 'lucide-react'
import { usersApi } from '../../services/api'

export default function ReviewerSettingsPage() {
  const { user } = useAuth()

  const [profileForm, setProfileForm] = useState({
    name:            user?.name            || '',
    affiliation:     user?.affiliation     || '',
    orcid:           user?.orcid           || '',
    expertise_areas: user?.expertise_areas || '',
    bio:             user?.bio             || '',
  })

  const [reviewPrefs, setReviewPrefs] = useState({
    max_active_reviews:    3,
    preferred_turnaround:  21,
    available:             true,
    subject_areas:         user?.expertise_areas || '',
  })

  const [notifPrefs, setNotifPrefs] = useState({
    notify_on_invitation: user?.notification_preferences?.notify_on_invitation ?? true,
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password:     '',
    confirm:          '',
  })

  const [showPw,    setShowPw]    = useState(false)
  const [savedMsg,  setSavedMsg]  = useState('')
  const [activeTab, setActiveTab] = useState('profile')

  const tabs = [
    { key: 'profile',     label: 'Profile',          icon: User     },
    { key: 'review',      label: 'Review Preferences',icon: BookOpen },
    { key: 'notifications',label: 'Notifications',   icon: Bell     },
    { key: 'security',    label: 'Security',          icon: Shield   },
  ]

  const showSuccess = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSaveProfile = async (e) => {
  e.preventDefault()
  try {
    await usersApi.updateMe({
      name:            profileForm.name,
      affiliation:     profileForm.affiliation,
      orcid:           profileForm.orcid,
      expertise_areas: profileForm.expertise_areas,
      bio:             profileForm.bio,
    })
    setSavedMsg('Profile updated successfully.')
  } catch (err) {
    setSavedMsg(`Error: ${err.message}`)
  }
  setTimeout(() => setSavedMsg(''), 3000)
}

  const handleSaveReviewPrefs = (e) => {
    e.preventDefault()
    showSuccess('Review preferences saved.')
  }

  const handleSaveNotifications = async () => {
    try {
      await usersApi.updateMe({ notification_preferences: notifPrefs })
      showSuccess('Notification preferences saved.')
    } catch (err) {
      showSuccess(`Error: ${err.message}`)
    }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.new_password !== passwordForm.confirm) {
      setSavedMsg('New passwords do not match.')
      setTimeout(() => setSavedMsg(''), 3000)
      return
    }
    if (passwordForm.new_password.length < 8) {
      setSavedMsg('Password must be at least 8 characters.')
      setTimeout(() => setSavedMsg(''), 3000)
      return
    }
    if (!/[a-zA-Z]/.test(passwordForm.new_password) || !/[0-9]/.test(passwordForm.new_password)) {
      setSavedMsg('Password must contain both letters and numbers.')
      setTimeout(() => setSavedMsg(''), 3000)
      return
    }
    try {
      await usersApi.changePassword(passwordForm.current_password, passwordForm.new_password)
      setSavedMsg('Password changed successfully.')
      setPasswordForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setSavedMsg(`Error: ${err.message}`)
    }
    setTimeout(() => setSavedMsg(''), 4000)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your reviewer profile and preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap flex-shrink-0 transition-colors ${
                activeTab === t.key
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      {/* Saved message */}
      {savedMsg && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-medium ${
          savedMsg.includes('match')
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
              <p className="text-xs text-gray-500">Reviewer · {user?.email}</p>
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
                placeholder="University / Institution"
                className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">ORCID iD</label>
              <input type="text" value={profileForm.orcid}
                onChange={e => setProfileForm(p => ({ ...p, orcid: e.target.value }))}
                placeholder="0000-0000-0000-0000"
                className="form-input text-sm" />
            </div>
            <div>
              <label className="form-label">Expertise Areas</label>
              <input type="text" value={profileForm.expertise_areas}
                onChange={e => setProfileForm(p => ({ ...p, expertise_areas: e.target.value }))}
                placeholder="e.g. Machine Learning, IoT"
                className="form-input text-sm" />
            </div>
          </div>
          <div>
            <label className="form-label">
              Bio <span className="text-gray-400 normal-case font-normal">(optional)</span>
            </label>
            <textarea value={profileForm.bio} rows={3}
              onChange={e => setProfileForm(p => ({ ...p, bio: e.target.value }))}
              placeholder="A short professional biography..."
              className="form-input text-sm resize-none" />
          </div>
          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Save Profile
          </button>
        </form>
      )}

      {/* Review Preferences Tab */}
      {activeTab === 'review' && (
        <form onSubmit={handleSaveReviewPrefs} className="card p-5 sm:p-6 space-y-5">
          <h3 className="font-bold text-navy-900 pb-3 border-b border-gray-100">
            Review Preferences
          </h3>

          {/* Availability toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-semibold text-gray-800">Available for Reviews</p>
              <p className="text-xs text-gray-500 mt-0.5">
                When off, editors will not be able to invite you to new reviews
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReviewPrefs(p => ({ ...p, available: !p.available }))}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                reviewPrefs.available ? 'bg-navy-900' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                reviewPrefs.available ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">
                Max Active Reviews at One Time
              </label>
              <select
                value={reviewPrefs.max_active_reviews}
                onChange={e => setReviewPrefs(p => ({ ...p, max_active_reviews: Number(e.target.value) }))}
                className="form-input text-sm"
              >
                {[1, 2, 3, 4, 5].map(n => (
                  <option key={n} value={n}>{n} review{n > 1 ? 's' : ''}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Editors see this limit when assigning reviewers
              </p>
            </div>
            <div>
              <label className="form-label">
                Preferred Review Turnaround (days)
              </label>
              <select
                value={reviewPrefs.preferred_turnaround}
                onChange={e => setReviewPrefs(p => ({ ...p, preferred_turnaround: Number(e.target.value) }))}
                className="form-input text-sm"
              >
                {[14, 21, 28, 42, 60].map(n => (
                  <option key={n} value={n}>{n} days</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Subject Areas You Review</label>
            <textarea
              value={reviewPrefs.subject_areas}
              rows={3}
              onChange={e => setReviewPrefs(p => ({ ...p, subject_areas: e.target.value }))}
              placeholder="e.g. Machine Learning, Edge Computing, Cybersecurity"
              className="form-input text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              Comma-separated. Editors use this to match you with relevant manuscripts.
            </p>
          </div>

          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Save Preferences
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
              { key: 'notify_on_invitation', label: 'Review Invitations', desc: 'Email me when an editor invites me to review a manuscript (this always shows up in your Invitations page either way)' },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                </div>
                <button
                  onClick={() => setNotifPrefs(p => ({ ...p, [n.key]: !p[n.key] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                    notifPrefs[n.key] ? 'bg-navy-900' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    notifPrefs[n.key] ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-gray-100 mt-4">
            <button
              onClick={handleSaveNotifications}
              className="btn-primary text-sm flex items-center gap-2"
            >
              <Save size={14} /> Save Preferences
            </button>
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
                className="form-input text-sm pr-10" placeholder="Min. 8 characters" />
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
              To change your email contact the editorial office.
            </p>
          </div>
        </form>
      )}
    </div>
  )
}