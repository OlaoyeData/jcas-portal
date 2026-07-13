import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Save, User, Shield, Eye, EyeOff } from 'lucide-react'
import { usersApi } from '../../services/api'

export default function AdminSettingsPage() {
  const { user } = useAuth()

  const [profileForm, setProfileForm] = useState({
    name:        user?.name        || '',
    affiliation: user?.affiliation || '',
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
    { key: 'profile',  label: 'Profile',  icon: User   },
    { key: 'security', label: 'Security', icon: Shield },
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
      })
      showSaved('Profile updated successfully.')
    } catch (err) {
      showSaved(`Error: ${err.message}`)
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
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Account Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage your administrator profile and password.
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
              <p className="text-xs text-gray-500">Administrator · {user?.email}</p>
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
          <button type="submit" className="btn-primary text-sm flex items-center gap-2">
            <Save size={14} /> Save Profile
          </button>
        </form>
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
        </form>
      )}
    </div>
  )
}