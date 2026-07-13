import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, AlertCircle, CheckCircle, Loader, X } from 'lucide-react'
import { announcementsApi } from '../../services/api'

const TYPES = [
  { value: 'info',    label: 'Info',    cls: 'bg-blue-100 text-blue-700'   },
  { value: 'success', label: 'Success', cls: 'bg-green-100 text-green-700' },
  { value: 'warning', label: 'Warning', cls: 'bg-amber-100 text-amber-700' },
  { value: 'urgent',  label: 'Urgent',  cls: 'bg-red-100 text-red-700'     },
]

const EMPTY = { title: '', message: '', type: 'info', is_active: true, link: '', link_text: '', expires_at: '' }

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState(EMPTY)
  const [saving,        setSaving]        = useState(false)
  const [error,         setError]         = useState('')
  const [success,       setSuccess]       = useState('')

  const load = () => {
    setLoading(true)
    announcementsApi.getAll()
      .then(data => setAnnouncements(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setShowForm(true)
  }

  const openEdit = (ann) => {
    setEditing(ann.id)
    setForm({
      title:      ann.title,
      message:    ann.message,
      type:       ann.type,
      is_active:  ann.is_active,
      link:       ann.link       || '',
      link_text:  ann.link_text  || '',
      expires_at: ann.expires_at ? ann.expires_at.slice(0, 16) : '',
    })
    setError('')
    setShowForm(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) {
      setError('Title and message are required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        link:       form.link      || null,
        link_text:  form.link_text || null,
      }
      if (editing) {
        await announcementsApi.update(editing, payload)
        setSuccess('Announcement updated.')
      } else {
        await announcementsApi.create(payload)
        setSuccess('Announcement created.')
      }
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.message || 'Failed to save.')
    } finally {
      setSaving(false)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  const handleToggle = async (ann) => {
    try {
      await announcementsApi.update(ann.id, { is_active: !ann.is_active })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return
    try {
      await announcementsApi.delete(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const typeCls = (type) => TYPES.find(t => t.value === type)?.cls || 'bg-gray-100 text-gray-600'

  return (
    <div className="p-6 lg:p-8 max-w-4xl">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Announcements</h1>
          <p className="text-gray-500 text-sm mt-0.5">Publish banners visible on the homepage to all visitors.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {success && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle size={14} /> {success}
        </div>
      )}
      {error && !showForm && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-2 border-navy-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-navy-900">{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Title <span className="text-red-500">*</span></label>
                <input type="text" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="form-input text-sm" placeholder="e.g. Submission Deadline Extended" />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="form-input text-sm">
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Message <span className="text-red-500">*</span></label>
              <textarea value={form.message} rows={3}
                onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                className="form-input text-sm resize-none"
                placeholder="The announcement text shown to all visitors…" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Link URL <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.link}
                onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                className="form-input text-sm" placeholder="e.g. /submit/guidelines" />
              </div>
              <div>
                <label className="form-label">Link Text <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={form.link_text}
                  onChange={e => setForm(p => ({ ...p, link_text: e.target.value }))}
                  className="form-input text-sm" placeholder="Learn more" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="form-label">Expires At <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="datetime-local" value={form.expires_at}
                  onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
                  className="form-input text-sm" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-navy-700" />
                Publish immediately (visible on homepage)
              </label>
            </div>

            {/* Preview */}
            {(form.title || form.message) && (
              <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
                form.type === 'urgent'  ? 'bg-red-600 text-white'   :
                form.type === 'warning' ? 'bg-amber-500 text-white' :
                form.type === 'success' ? 'bg-green-700 text-white' :
                'bg-blue-700 text-white'
              }`}>
                <div>
                  <span className="font-semibold">{form.title}: </span>
                  <span>{form.message}</span>
                  {form.link && form.link_text && (
                    <span className="underline ml-1 font-semibold">{form.link_text} →</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
                {saving ? <><Loader size={13} className="animate-spin" /> Saving…</> : editing ? 'Update' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 flex items-center justify-center gap-2">
          <Loader size={18} className="animate-spin" /> Loading…
        </div>
      ) : announcements.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium">No announcements yet.</p>
          <p className="text-sm mt-1">Create one to display a banner on the homepage.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(ann => (
            <div key={ann.id} className={`card p-4 flex items-start gap-4 ${!ann.is_active ? 'opacity-60' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded uppercase ${typeCls(ann.type)}`}>
                    {ann.type}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    ann.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {ann.is_active ? 'Live' : 'Hidden'}
                  </span>
                  {ann.expires_at && (
                    <span className="text-xs text-gray-400">
                      Expires: {new Date(ann.expires_at).toLocaleDateString('en-GB')}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-gray-800">{ann.title}</p>
                <p className="text-sm text-gray-500 mt-0.5 truncate">{ann.message}</p>
                {ann.link && (
                  <a href={ann.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-0.5 block truncate">
                    {ann.link_text || ann.link}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleToggle(ann)} title={ann.is_active ? 'Hide' : 'Show'}
                  className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded transition-colors">
                  {ann.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button onClick={() => openEdit(ann)} title="Edit"
                  className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 rounded transition-colors">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(ann.id)} title="Delete"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}