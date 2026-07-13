import React, { useState, useEffect } from 'react'
import { Plus, ChevronDown, ChevronRight, BookOpen, Loader, AlertCircle, CheckCircle } from 'lucide-react'
import { archiveApi } from '../../services/api'

export default function AdminVolumesPage() {
  const [volumes,      setVolumes]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [expandedVols, setExpandedVols] = useState({})

  // Create volume form
  const [volForm,      setVolForm]      = useState({ volume_number: '', year: '', description: '' })
  const [volLoading,   setVolLoading]   = useState(false)
  const [volSuccess,   setVolSuccess]   = useState('')
  const [volError,     setVolError]     = useState('')

  // Create issue form
  const [issueFor,     setIssueFor]     = useState(null)   // volume id
  const [issueForm,    setIssueForm]    = useState({ issue_number: '', period: '', description: '' })
  const [issLoading,   setIssLoading]   = useState(false)
  const [issSuccess,   setIssSuccess]   = useState('')
  const [issError,     setIssError]     = useState('')

  useEffect(() => { loadVolumes() }, [])

  const loadVolumes = () => {
    setLoading(true)
    archiveApi.volumes()
      .then(data => setVolumes(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const toggleVol = (id) =>
    setExpandedVols(prev => ({ ...prev, [id]: !prev[id] }))

  const handleCreateVolume = async () => {
    if (!volForm.volume_number || !volForm.year) { setVolError('Volume number and year are required.'); return }
    setVolLoading(true); setVolError(''); setVolSuccess('')
    try {
      await archiveApi.createVolume({
        volume_number: parseInt(volForm.volume_number),
        year:          parseInt(volForm.year),
        description:   volForm.description,
      })
      setVolSuccess(`Volume ${volForm.volume_number} (${volForm.year}) created.`)
      setVolForm({ volume_number: '', year: '', description: '' })
      loadVolumes()
    } catch (err) {
      setVolError(err.message || 'Failed to create volume.')
    } finally {
      setVolLoading(false)
    }
  }

  const handleCreateIssue = async () => {
    if (!issueForm.issue_number) { setIssError('Issue number is required.'); return }
    setIssLoading(true); setIssError(''); setIssSuccess('')
    try {
      await archiveApi.createIssue({
        volume_id:    issueFor,
        issue_number: parseInt(issueForm.issue_number),
        period:       issueForm.period,
        description:  issueForm.description,
      })
      setIssSuccess(`Issue ${issueForm.issue_number} created.`)
      setIssueForm({ issue_number: '', period: '', description: '' })
      setIssueFor(null)
      loadVolumes()
    } catch (err) {
      setIssError(err.message || 'Failed to create issue.')
    } finally {
      setIssLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Volumes &amp; Issues</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Create and manage journal volumes and their issues.
          Articles are assigned to issues when published.
        </p>
      </div>

      {/* Create Volume */}
      <div className="card p-5 mb-6">
        <h3 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
          <BookOpen size={15} className="text-navy-600" /> Create New Volume
        </h3>
        <p className="text-xs text-gray-500 mb-4">A volume typically represents one year of publication.</p>

        {volSuccess && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <CheckCircle size={13} className="flex-shrink-0" /> {volSuccess}
          </div>
        )}
        {volError && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            <AlertCircle size={13} className="flex-shrink-0" /> {volError}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="form-label">Volume Number <span className="text-red-500">*</span></label>
            <input
              type="number" min="1"
              value={volForm.volume_number}
              onChange={e => setVolForm(p => ({ ...p, volume_number: e.target.value }))}
              placeholder="e.g. 1"
              className="form-input text-sm"
            />
          </div>
          <div>
            <label className="form-label">Year <span className="text-red-500">*</span></label>
            <input
              type="number" min="2000" max="2100"
              value={volForm.year}
              onChange={e => setVolForm(p => ({ ...p, year: e.target.value }))}
              placeholder="e.g. 2025"
              className="form-input text-sm"
            />
          </div>
          <div>
            <label className="form-label">Description</label>
            <input
              type="text"
              value={volForm.description}
              onChange={e => setVolForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Optional note"
              className="form-input text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleCreateVolume}
          disabled={volLoading}
          className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
        >
          {volLoading
            ? <><Loader size={13} className="animate-spin" /> Creating…</>
            : <><Plus size={13} /> Create Volume</>
          }
        </button>
      </div>

      {/* Volumes list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-center py-10 text-gray-400 text-sm">Loading volumes…</p>
        ) : volumes.length === 0 ? (
          <div className="card p-10 text-center text-gray-400 text-sm">
            No volumes yet. Create the first one above.
          </div>
        ) : volumes.map(vol => (
          <div key={vol.id} className="card overflow-hidden">

            {/* Volume header */}
            <button
              onClick={() => toggleVol(vol.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={16} className="text-navy-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-navy-900">
                    Volume {vol.volume_number}{' '}
                    <span className="font-normal text-gray-500">({vol.year})</span>
                  </p>
                  {vol.description && (
                    <p className="text-xs text-gray-400">{vol.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {(vol.issues || []).length} issue{(vol.issues || []).length !== 1 ? 's' : ''}
                </span>
                {expandedVols[vol.id]
                  ? <ChevronDown size={16} className="text-gray-400" />
                  : <ChevronRight size={16} className="text-gray-400" />
                }
              </div>
            </button>

            {/* Issues */}
            {expandedVols[vol.id] && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">

                {(vol.issues || []).length === 0 ? (
                  <p className="px-5 py-4 text-xs text-gray-400">No issues yet.</p>
                ) : (vol.issues || []).map(iss => (
                  <div key={iss.id} className="px-5 py-3 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        Issue {iss.issue_number}
                        {iss.period && <span className="text-gray-400 font-normal ml-1">· {iss.period}</span>}
                      </p>
                      {iss.description && <p className="text-xs text-gray-400">{iss.description}</p>}
                    </div>
                    <span className="text-xs text-gray-400">
                      {(iss.articles || []).length} article{(iss.articles || []).length !== 1 ? 's' : ''}
                    </span>
                  </div>
                ))}

                {/* Create Issue form */}
                {issueFor === vol.id ? (
                  <div className="px-5 py-4 bg-blue-50/40 space-y-3">
                    <p className="text-xs font-semibold text-navy-800 uppercase tracking-wide">
                      Add Issue to Volume {vol.volume_number}
                    </p>

                    {issSuccess && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                        <CheckCircle size={12} /> {issSuccess}
                      </div>
                    )}
                    {issError && (
                      <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                        <AlertCircle size={12} /> {issError}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-3 gap-2">
                      <div>
                        <label className="form-label text-xs">Issue Number <span className="text-red-500">*</span></label>
                        <input
                          type="number" min="1"
                          value={issueForm.issue_number}
                          onChange={e => setIssueForm(p => ({ ...p, issue_number: e.target.value }))}
                          placeholder="e.g. 1"
                          className="form-input text-sm"
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">Period</label>
                        <input
                          type="text"
                          value={issueForm.period}
                          onChange={e => setIssueForm(p => ({ ...p, period: e.target.value }))}
                          placeholder="e.g. Jan–Jun"
                          className="form-input text-sm"
                        />
                      </div>
                      <div>
                        <label className="form-label text-xs">Description</label>
                        <input
                          type="text"
                          value={issueForm.description}
                          onChange={e => setIssueForm(p => ({ ...p, description: e.target.value }))}
                          placeholder="Optional"
                          className="form-input text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateIssue}
                        disabled={issLoading}
                        className="btn-primary text-xs py-1.5 flex items-center gap-1.5 disabled:opacity-60"
                      >
                        {issLoading
                          ? <><Loader size={11} className="animate-spin" /> Creating…</>
                          : <><Plus size={11} /> Create Issue</>
                        }
                      </button>
                      <button
                        onClick={() => { setIssueFor(null); setIssError(''); setIssSuccess('') }}
                        className="btn-outline text-xs py-1.5"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3">
                    <button
                      onClick={() => {
                        setIssueFor(vol.id)
                        setIssueForm({ issue_number: '', period: '', description: '' })
                        setIssError(''); setIssSuccess('')
                      }}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      <Plus size={12} /> Add Issue
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}