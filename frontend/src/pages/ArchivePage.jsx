import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp, FileText, Globe, Lock, BookmarkIcon, Loader } from 'lucide-react'
import { archiveApi } from '../services/api'

export default function ArchivePage() {
  const [volumes,        setVolumes]        = useState([])
  const [articles,       setArticles]       = useState([])
  const [loading,        setLoading]        = useState(true)
  const [articlesLoading,setArticlesLoading]= useState(false)
  const [expandedVolume, setExpandedVolume] = useState(null)
  const [selectedIssue,  setSelectedIssue]  = useState(null)
  const [filters,        setFilters]        = useState({ openAccess: false, research: false, review: false })

  useEffect(() => {
  archiveApi.volumes()
    .then(data => {
      const vols = data || []
      setVolumes(vols)
      if (vols.length > 0) {
        setExpandedVolume(vols[0].volume_number)
        outer:
        for (const vol of vols) {
          for (const iss of (vol.issues || [])) {
            if ((iss.article_count || 0) > 0) {
              setSelectedIssue({ vol: vol.volume_number, iss: iss.issue_number, issueObj: iss })
              break outer
            }
          }
        }
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false))
}, [])

  useEffect(() => {
    if (!selectedIssue) return
    setArticlesLoading(true)
    const params = {}
    if (filters.openAccess) params.access_type = 'open'
    if (filters.research && !filters.review) params.article_type = 'Research Article'
    if (filters.review && !filters.research) params.article_type = 'Review Paper'

    archiveApi.articles(selectedIssue.vol, selectedIssue.iss, params)
      .then(data => setArticles(data || []))
      .catch(() => setArticles([]))
      .finally(() => setArticlesLoading(false))
  }, [selectedIssue, filters])

  const [recentArticles, setRecentArticles] = useState([])

  useEffect(() => {
    archiveApi.search({ limit: 20 })
      .then(data => setRecentArticles(data || []))
      .catch(() => {})
  }, [])

  const toggleFilter = (key) => setFilters(p => ({ ...p, [key]: !p[key] }))

  const handleSelectIssue = (volNumber, iss) => {
    setSelectedIssue({ vol: volNumber, iss: iss.issue_number, issueObj: iss })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader size={24} className="animate-spin mr-2" /> Loading archive…
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-56 flex-shrink-0">
          <div className="card p-4 sticky top-20">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Browse by Volume</h3>
            {volumes.length === 0 ? (
              <p className="text-xs text-gray-400">No volumes yet.</p>
            ) : (
              <div className="space-y-1">
                {volumes.map(vol => (
                  <div key={vol.id}>
                    <button
                      onClick={() => setExpandedVolume(expandedVolume === vol.volume_number ? null : vol.volume_number)}
                      className="w-full flex items-center justify-between py-1.5 px-2 rounded text-sm hover:bg-gray-50 transition-colors"
                    >
                      <span className={`font-medium ${expandedVolume === vol.volume_number ? 'text-navy-900' : 'text-gray-600'}`}>
                        Volume {vol.volume_number} ({vol.year})
                      </span>
                      {expandedVolume === vol.volume_number
                        ? <ChevronUp size={14} className="text-gray-400" />
                        : <ChevronDown size={14} className="text-gray-400" />}
                    </button>
                    {expandedVolume === vol.volume_number && (
                      <div className="pl-3 space-y-0.5 mt-1 mb-2">
                        {(vol.issues || []).map(iss => {
                          const active = selectedIssue?.vol === vol.volume_number && selectedIssue?.iss === iss.issue_number
                          return (
                            <button
                              key={iss.id}
                              onClick={() => handleSelectIssue(vol.volume_number, iss)}
                              className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                active ? 'text-blue-700 font-semibold bg-blue-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                              }`}
                            >
                              Issue {iss.issue_number}{iss.period ? ` · ${iss.period}` : ''}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-gray-100 mt-4 pt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Filter Content</p>
              <div className="space-y-2">
                {[
                  { key: 'openAccess', label: 'Open Access Only' },
                  { key: 'research',   label: 'Research Articles' },
                  { key: 'review',     label: 'Review Papers' },
                ].map(f => (
                  <label key={f.key} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    <input type="checkbox" checked={filters[f.key]} onChange={() => toggleFilter(f.key)}
                      className="rounded border-gray-300 text-navy-700 focus:ring-navy-600" />
                    {f.label}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0">
          {selectedIssue ? (
            <>
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-navy-900">
                  Volume {selectedIssue.vol}, Issue {selectedIssue.iss}
                </h1>
                {selectedIssue.issueObj?.period && (
                  <p className="text-gray-500 mt-1 text-sm">{selectedIssue.issueObj.period}</p>
                )}
              </div>

              {articlesLoading ? (
                <div className="flex items-center justify-center h-32 text-gray-400">
                  <Loader size={20} className="animate-spin mr-2" /> Loading articles…
                </div>
              ) : articles.length === 0 ? (
                <div className="card p-12 text-center text-gray-500">
                  <BookmarkIcon size={32} className="mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No articles in this issue yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {articles.map(article => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              )}
            </>
         ) : (
            <>
              {/* Fallback: show all published articles when no issue is selected */}
              {!selectedIssue && recentArticles.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-lg font-bold text-navy-900 mb-4">Recently Published</h2>
                  <div className="space-y-4">
                    {recentArticles.map(article => (
                      <div key={article.id} className="card p-5">
                        {/* ...article card markup... */}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="card p-12 text-center text-gray-400">
                <BookmarkIcon size={32} className="mx-auto mb-3 text-gray-300" />
                <p>Select a volume and issue from the sidebar.</p>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function ArticleCard({ article }) {
  const [expanded, setExpanded] = useState(false)
  const abstract = article.abstract || ''
  const title    = article.title    || 'Untitled'
  const authors  = article.authors  || []   // ← was article.manuscript?.co_authors
  const pages    = article.page_start && article.page_end
    ? `${article.page_start}–${article.page_end}` : ''

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
          OPEN ACCESS
        </span>
        {article.article_type && (
          <span className="text-xs text-gray-500">{article.article_type}</span>
        )}
      </div>

      <Link to={`/article/${article.id}`}>
        <h3 className="text-lg font-semibold text-navy-900 hover:text-blue-700 transition-colors leading-snug mb-1.5">
          {title}
        </h3>
      </Link>

      {authors.length > 0 && (
        <p className="text-sm text-gray-600 mb-1">
          {authors.map(a => a.name).join(', ')}
        </p>
      )}

      {article.doi && (
        <p className="text-xs text-gray-400 mb-3">
          DOI: {article.doi}{pages ? ` · pp. ${pages}` : ''}
        </p>
      )}

      {abstract && (
        <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-sm text-gray-600 leading-relaxed mb-3">
          <p>{expanded ? abstract : abstract.slice(0, 180) + (abstract.length > 180 ? '…' : '')}</p>
          {abstract.length > 180 && (
            <button onClick={() => setExpanded(!expanded)}
              className="text-blue-600 font-medium text-xs mt-1 flex items-center gap-1 hover:underline">
              {expanded ? 'Collapse' : 'Read Abstract'}
              <ChevronDown size={12} className={expanded ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          )}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link to={`/article/${article.id}`} className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5">
          <Globe size={12} /> View Article
        </Link>
      </div>
    </div>
  )
}