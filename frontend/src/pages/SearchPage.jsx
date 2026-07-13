import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, Filter, X, Loader } from 'lucide-react'
import { archiveApi } from '../services/api'

const YEARS    = ['2026','2025','2024','2023','2022','2021','2020']

function highlightQuery(text, query) {
  if (!query || !text) return text
  const parts = String(text).split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase()
          ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5">{part}</mark>
          : part
      )}
    </span>
  )
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQ = searchParams.get('q') || ''

  const [query,          setQuery]          = useState(initialQ)
  const [debouncedQ,     setDebouncedQ]     = useState(initialQ)
  const [results,        setResults]        = useState([])
  const [loading,        setLoading]        = useState(false)
  const [selectedYear,   setSelectedYear]   = useState('all')
  const [selectedAccess, setSelectedAccess] = useState('all')
  const [page,           setPage]           = useState(1)
  const PER_PAGE = 10

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 350)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const params = {}
    if (debouncedQ)             params.q           = debouncedQ
    if (selectedYear  !== 'all') params.year        = selectedYear
    if (selectedAccess !== 'all') params.access_type = selectedAccess

    setLoading(true)
    archiveApi.search(params)
      .then(data => { setResults(data || []); setPage(1) })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [debouncedQ, selectedYear, selectedAccess])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams(query ? { q: query } : {})
  }

  const totalPages = Math.ceil(results.length / PER_PAGE)
  const paginated  = results.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-900 mb-4">Search Archive</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Search by title, author, keywords, abstract…"
              className="w-full pl-9 pr-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-600" />
            {query && (
              <button type="button"
                onClick={() => { setQuery(''); setDebouncedQ(''); setSearchParams({}) }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={15} />
              </button>
            )}
          </div>
          <button type="submit" className="btn-primary px-6">Search</button>
        </form>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Filters */}
        <aside className="sm:w-52 flex-shrink-0">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter size={14} className="text-gray-500" />
              <h3 className="text-sm font-bold text-gray-700">Filters</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Year</p>
                <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setPage(1) }}
                  className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-navy-600">
                  <option value="all">All Years</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
             <button onClick={() => { setSelectedYear('all'); setSelectedAccess('all'); setPage(1) }}
                className="text-xs text-blue-600 hover:underline">
                Clear all filters
              </button>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            {loading ? (
              <p className="text-sm text-gray-400 flex items-center gap-2"><Loader size={13} className="animate-spin" /> Searching…</p>
            ) : (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">{results.length}</span> result{results.length !== 1 ? 's' : ''}
                {debouncedQ ? <> for "<span className="font-semibold">{debouncedQ}</span>"</> : ''}
              </p>
            )}
          </div>

          {!loading && paginated.length === 0 ? (
            <div className="card p-10 text-center">
              <Search size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-600">No results found</p>
              <p className="text-sm text-gray-400 mt-1">Try different keywords or remove filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map(article => {
                const title   = article.title    || 'Untitled'
                const abstract= article.abstract || ''
                const authors = article.authors  || []
                const keywords= article.keywords?.split(',').map(k => k.trim()).filter(Boolean) || []
                const volNum  = article.volume_number
                const issNum  = article.issue_number
                const year    = article.year || (article.published_at ? new Date(article.published_at).getFullYear() : '')

                return (
                  <div key={article.id} className="card p-5 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                        OPEN ACCESS
                      </span>
                      {article.article_type && <span className="text-xs text-gray-400">{article.article_type}</span>}
                      {volNum && (
                        <span className="text-xs text-gray-400 ml-auto">
                          Vol. {volNum}, Issue {issNum} ({year})
                        </span>
                      )}
                    </div>
                    <Link to={`/article/${article.id}`}>
                      <h3 className="font-semibold text-navy-900 hover:text-blue-700 transition-colors mb-1.5 leading-snug">
                        {highlightQuery(title, debouncedQ)}
                      </h3>
                    </Link>
                    {authors.length > 0 && (
                      <p className="text-sm text-gray-500 mb-2">{authors.map(a => a.name).join(', ')}</p>
                    )}
                    {abstract && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                        {highlightQuery(abstract.slice(0, 220) + (abstract.length > 220 ? '…' : ''), debouncedQ)}
                      </p>
                    )}
                    {keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {keywords.map(kw => (
                          <button key={kw} onClick={() => { setQuery(kw); setDebouncedQ(kw) }}
                            className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:border-navy-400 hover:text-navy-700 transition-colors">
                            {kw}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded text-sm font-medium ${p === page ? 'bg-navy-900 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}