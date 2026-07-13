import React, { useState, useEffect } from 'react'
import { Plus, Loader, CheckCircle, AlertCircle } from 'lucide-react'
import { subjectsApi } from '../../services/api'

export default function AdminSubjectsPage() {
  const [subjects,       setSubjects]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [newSubject,     setNewSubject]     = useState({ name: '', slug: '' })
  const [editingId,      setEditingId]      = useState(null)
  const [editingName,    setEditingName]    = useState('')
  const [saving,         setSaving]         = useState(false)
  const [error,          setError]          = useState('')
  const [success,        setSuccess]        = useState('')

  const load = () => {
    setLoading(true)
    subjectsApi.list(false)
      .then(data => setSubjects(data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

  const handleAdd = async () => {
    if (!newSubject.name.trim() || !newSubject.slug.trim()) {
      setError('Name and slug are required.'); return
    }
    setSaving(true); setError('')
    try {
      await subjectsApi.create({ name: newSubject.name.trim(), slug: newSubject.slug.trim() })
      setNewSubject({ name: '', slug: '' })
      flash('Subject area added.')
      load()
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const handleToggle = async (s) => {
    try {
      await subjectsApi.update(s.id, { is_active: !s.is_active })
      load()
    } catch (err) { setError(err.message) }
  }

  const handleRename = async (s) => {
    if (!editingName.trim()) { setEditingId(null); return }
    try {
      await subjectsApi.update(s.id, { name: editingName.trim() })
      setEditingId(null)
      load()
    } catch (err) { setError(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this subject area? This cannot be undone.')) return
    try {
      await subjectsApi.delete(id)
      flash('Subject area deleted.')
      load()
    } catch (err) { setError(err.message) }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Subject Areas</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Manage the subject area taxonomy used in submission forms and search filters.
        </p>
      </div>

      {/* Add new */}
      <div className="card p-5 mb-5">
        <h3 className="font-bold text-navy-900 mb-3 flex items-center gap-2">
          <Plus size={15} /> Add Subject Area
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <input type="text" value={newSubject.name}
            onChange={e => setNewSubject(p => ({
              ...p,
              name: e.target.value,
              slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
            }))}
            placeholder="Subject area name"
            className="form-input flex-1 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input type="text" value={newSubject.slug}
            onChange={e => setNewSubject(p => ({ ...p, slug: e.target.value }))}
            placeholder="url-slug"
            className="form-input w-full sm:w-36 text-sm font-mono" />
          <button onClick={handleAdd} disabled={saving}
            className="btn-primary text-sm py-2 flex-shrink-0 flex items-center gap-1.5 disabled:opacity-60">
            {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Add
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Press Enter or click Add. The slug is auto-generated from the name but can be edited.
        </p>
      </div>

      {success && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          <CheckCircle size={13} /> {success}
        </div>
      )}
      {error && (
        <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">
          <AlertCircle size={13} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* Subject list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">
            {subjects.length} Subject Area{subjects.length !== 1 ? 's' : ''}
          </h3>
          <span className="text-xs text-gray-400">
            {subjects.filter(s => s.is_active).length} active
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-gray-400 gap-2">
            <Loader size={16} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-2.5">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5 hidden sm:table-cell">Slug</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-800">
                    {editingId === s.id ? (
                      <input type="text" value={editingName}
                        onChange={e => setEditingName(e.target.value)}
                        onBlur={() => handleRename(s)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRename(s); if (e.key === 'Escape') setEditingId(null) }}
                        autoFocus className="form-input text-sm py-1" />
                    ) : (
                      <button onClick={() => { setEditingId(s.id); setEditingName(s.name) }}
                        className="hover:text-blue-600 transition-colors text-left" title="Click to rename">
                        {s.name}
                      </button>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-500 font-mono hidden sm:table-cell">{s.slug}</td>
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {s.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggle(s)} className="text-xs text-blue-600 hover:underline">
                        {s.is_active ? 'Hide' : 'Show'}
                      </button>
                      <span className="text-gray-300">·</span>
                      <button onClick={() => handleDelete(s.id)} className="text-xs text-red-500 hover:underline">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}