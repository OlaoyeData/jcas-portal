import React, { useState, useEffect } from 'react'
import { Save, Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { journalApi } from '../../services/api'

export default function AdminJournalPage() {
  const [settings, setSettings] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState('')
  const [error,    setError]    = useState('')

  useEffect(() => {
    journalApi.get()
      .then(data => setSettings(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const updated = await journalApi.update({
        name:               settings.name,
        issn_online:        settings.issn_online,
        issn_print:         settings.issn_print,
        description:        settings.description,
        review_model:       settings.review_model,
        submissions_open:   settings.submissions_open,
        allowed_file_types: settings.allowed_file_types,
        max_upload_mb:      settings.max_upload_mb,
      })
      setSettings(updated)
      setSuccess('Settings saved successfully.')
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400 gap-2">
      <Loader size={18} className="animate-spin" /> Loading…
    </div>
  )

  if (!settings) return (
    <div className="p-8 text-center text-red-500">Failed to load settings.</div>
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Journal Settings</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Configure journal information, review model, and submission rules.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* Basic info */}
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100">
            Journal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="form-label">Journal Name</label>
              <input type="text" value={settings.name}
                onChange={e => setSettings(p => ({ ...p, name: e.target.value }))}
                className="form-input text-sm" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">ISSN (Online)</label>
                <input type="text" value={settings.issn_online || ''}
                  onChange={e => setSettings(p => ({ ...p, issn_online: e.target.value }))}
                  className="form-input text-sm" placeholder="0000-0000" />
              </div>
              <div>
                <label className="form-label">ISSN (Print)</label>
                <input type="text" value={settings.issn_print || ''}
                  onChange={e => setSettings(p => ({ ...p, issn_print: e.target.value }))}
                  className="form-input text-sm" placeholder="0000-0000" />
              </div>
            </div>
            <div>
              <label className="form-label">Journal Description</label>
              <textarea value={settings.description || ''} rows={3}
                onChange={e => setSettings(p => ({ ...p, description: e.target.value }))}
                className="form-input text-sm resize-none" />
            </div>
            <div>
              <label className="form-label">
                Cover Image <span className="text-gray-400 normal-case font-normal">(optional)</span>
              </label>
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-navy-400 cursor-pointer transition-colors">
                <Upload size={16} className="text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500">Click to upload cover image (PNG or JPG, max 2 MB)</span>
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
            {[
              { value: 'single_blind', label: 'Single-Blind',   desc: 'Reviewers know the authors but authors do not know the reviewers.'              },
              { value: 'double_blind', label: 'Double-Blind',   desc: 'Neither authors nor reviewers know each other. Recommended for impartial review.'},
              { value: 'open',         label: 'Open Review',    desc: 'Both authors and reviewers know each other. Promotes transparency.'              },
            ].map(opt => (
              <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                settings.review_model === opt.value
                  ? 'border-navy-900 bg-navy-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" name="review_model" value={opt.value}
                  checked={settings.review_model === opt.value}
                  onChange={() => setSettings(p => ({ ...p, review_model: opt.value }))}
                  className="mt-0.5 text-navy-700 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Submission settings */}
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-navy-900 mb-4 pb-3 border-b border-gray-100">
            Submission Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-semibold text-gray-800">Submissions Open</p>
                <p className="text-xs text-gray-500 mt-0.5">When off, the Submit page shows a closed notice</p>
              </div>
              <button type="button"
                onClick={() => setSettings(p => ({ ...p, submissions_open: !p.submissions_open }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  settings.submissions_open ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.submissions_open ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="form-label">Allowed File Types</label>
                <input type="text" value={settings.allowed_file_types}
                  onChange={e => setSettings(p => ({ ...p, allowed_file_types: e.target.value }))}
                  className="form-input text-sm" placeholder="pdf,docx,zip" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated extensions</p>
              </div>
              <div>
                <label className="form-label">Max Upload Size (MB)</label>
                <input type="number" value={settings.max_upload_mb} min={1} max={500}
                  onChange={e => setSettings(p => ({ ...p, max_upload_mb: Number(e.target.value) }))}
                  className="form-input text-sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Alerts + Save */}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <button type="submit" disabled={saving}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
          {saving ? <><Loader size={13} className="animate-spin" /> Saving…</> : <><Save size={14} /> Save Journal Settings</>}
        </button>

      </form>
    </div>
  )
}