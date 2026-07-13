import React, { useState, useEffect } from 'react'
import { Save, RotateCcw, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { emailTemplatesApi } from '../../services/api'

export default function AdminTemplatesPage() {
  const [templates,      setTemplates]      = useState([])
  const [activeKey,      setActiveKey]      = useState(null)
  const [editedSubject,  setEditedSubject]  = useState('')
  const [editedBody,     setEditedBody]     = useState('')
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [resetting,      setResetting]      = useState(false)
  const [success,        setSuccess]        = useState('')
  const [error,          setError]          = useState('')

  const load = () => {
    setLoading(true)
    emailTemplatesApi.list()
      .then(data => {
        setTemplates(data || [])
        if (data?.length > 0 && !activeKey) {
          setActiveKey(data[0].key)
          setEditedSubject(data[0].subject)
          setEditedBody(data[0].body)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const selectTemplate = (tmpl) => {
    setActiveKey(tmpl.key)
    setEditedSubject(tmpl.subject)
    setEditedBody(tmpl.body)
    setSuccess('')
    setError('')
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await emailTemplatesApi.update(activeKey, {
        subject: editedSubject,
        body:    editedBody,
      })
      setTemplates(p => p.map(t =>
        t.key === activeKey ? { ...t, subject: editedSubject, body: editedBody } : t
      ))
      setSuccess('Template saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleReset = async () => {
    if (!window.confirm('Reset this template to the default? Your changes will be lost.')) return
    setResetting(true)
    setError('')
    try {
      const updated = await emailTemplatesApi.reset(activeKey)
      setEditedSubject(updated.subject)
      setEditedBody(updated.body)
      setTemplates(p => p.map(t => t.key === activeKey ? updated : t))
      setSuccess('Template reset to default.')
    } catch (err) {
      setError(err.message || 'Failed to reset.')
    } finally {
      setResetting(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const active = templates.find(t => t.key === activeKey)

  const PLACEHOLDERS = {
    welcome:                  ['{author_name}', '{frontend_url}'],
    password_reset:           ['{author_name}', '{reset_url}', '{frontend_url}'],
    submission_confirmation:  ['{author_name}', '{manuscript_id}', '{manuscript_title}', '{frontend_url}'],
    review_invitation:        ['{reviewer_name}', '{manuscript_title}', '{deadline}', '{frontend_url}'],
    decision_notification:    ['{author_name}', '{manuscript_id}', '{manuscript_title}', '{decision}', '{frontend_url}'],
    revision_reminder:        ['{author_name}', '{manuscript_id}', '{manuscript_title}', '{deadline}', '{frontend_url}'],
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Email Templates</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Customise the emails sent automatically by the system. Changes take effect immediately.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
          <Loader size={18} className="animate-spin" /> Loading templates…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">

          {/* Sidebar */}
          <div className="sm:col-span-1">
            <div className="card p-2 space-y-1">
              {templates.map(tmpl => (
                <button key={tmpl.key} onClick={() => selectTemplate(tmpl)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors leading-snug ${
                    activeKey === tmpl.key
                      ? 'bg-navy-900 text-white font-semibold'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="sm:col-span-3">
            {active && (
              <div className="card p-5">
                <h3 className="font-bold text-navy-900 mb-1">{active.label}</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Last updated: {new Date(active.updated_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>

                {/* Placeholders */}
                {PLACEHOLDERS[activeKey] && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800 flex items-start gap-2 mb-4">
                    <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                    <span>
                      Available placeholders:{' '}
                      {PLACEHOLDERS[activeKey].map(p => (
                        <code key={p} className="bg-blue-100 px-1 py-0.5 rounded mx-0.5 font-mono">{p}</code>
                      ))}
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="form-label">Subject Line</label>
                    <input type="text" value={editedSubject}
                      onChange={e => setEditedSubject(e.target.value)}
                      className="form-input text-sm" />
                  </div>
                  <div>
                    <label className="form-label">Email Body</label>
                    <textarea rows={16} value={editedBody}
                      onChange={e => setEditedBody(e.target.value)}
                      className="form-input text-sm resize-y font-mono leading-relaxed" />
                  </div>
                </div>

                {/* Alerts */}
                {success && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                    <CheckCircle size={13} /> {success}
                  </div>
                )}
                {error && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
                    <AlertCircle size={13} /> {error}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 mt-4">
                  <button onClick={handleSave} disabled={saving}
                    className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
                    {saving ? <><Loader size={13} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Template</>}
                  </button>
                  <button onClick={handleReset} disabled={resetting}
                    className="btn-outline text-sm flex items-center gap-2 disabled:opacity-60">
                    {resetting ? <><Loader size={13} className="animate-spin" /> Resetting…</> : <><RotateCcw size={13} /> Reset to Default</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}