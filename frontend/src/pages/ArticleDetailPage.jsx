import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Download, ChevronLeft, Copy, Check, ExternalLink, Loader, AlertCircle } from 'lucide-react'
import { archiveApi, manuscriptsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

function generateBibtex(a) {
  const authors     = a.authors || []
  const firstAuthor = authors[0]?.name?.split(' ').pop() || 'Author'
  const year        = a.year || (a.published_at ? new Date(a.published_at).getFullYear() : '')
  const pages       = a.page_start && a.page_end ? `${a.page_start}--${a.page_end}` : ''
  return `@article{${firstAuthor.toLowerCase()}${year},
  title   = {${a.title || ''}},
  author  = {${authors.map(au => au.name).join(' and ')}},
  journal = {Journal of Computing \\& Applied Sciences},
  volume  = {${a.volume_number || ''}},
  number  = {${a.issue_number  || ''}},
  pages   = {${pages}},
  year    = {${year}},
  doi     = {${a.doi || ''}},
}`
}

function generateRIS(a) {
  const authors = a.authors || []
  const year    = a.year || (a.published_at ? new Date(a.published_at).getFullYear() : '')
  return `TY  - JOUR
TI  - ${a.title || ''}
${authors.map(au => `AU  - ${au.name}`).join('\n')}
JO  - Journal of Computing & Applied Sciences
VL  - ${a.volume_number || ''}
IS  - ${a.issue_number  || ''}
SP  - ${a.page_start || ''}
EP  - ${a.page_end   || ''}
PY  - ${year}
DO  - ${a.doi || ''}
ER  -`
}



export default function ArticleDetailPage() {
  const { id }         = useParams()
  const { user }       = useAuth()
  const [article,      setArticle]      = useState(null)
  const [related,      setRelated]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [citationTab,  setCitationTab]  = useState('bibtex')
  const [copied,       setCopied]       = useState(false)
  const [downloading,  setDownloading]  = useState(false)
  const [dlError,      setDlError]      = useState('')
const citationText = article ? (citationTab === 'bibtex' ? generateBibtex(article) : generateRIS(article)) : ''

  useEffect(() => {
    archiveApi.getArticle(id)
      .then(async data => {
        setArticle(data)
        archiveApi.recordDownload(id).catch(() => {})
        // Load related from same issue
        if (data.issue?.volume?.volume_number && data.issue?.issue_number) {
          archiveApi.articles(data.issue.volume.volume_number, data.issue.issue_number)
            .then(all => setRelated((all || []).filter(a => a.id !== data.id).slice(0, 3)))
            .catch(() => {})
        }
      })
      .catch(err => setError(err.message || 'Article not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleDownload = async () => {
    if (!user) { setDlError('Please log in to download this article.'); return }
    setDownloading(true)
    setDlError('')
    try {
      // fetch the manuscript to get its files
      const ms = await manuscriptsApi.get(article.manuscript_id)
      if (!ms?.files?.length) { setDlError('No file available for download.'); return }
      const file = ms.files[0]
      await manuscriptsApi.downloadFile(article.manuscript_id, file.id, file.filename)
    } catch {
      setDlError('Download failed. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(citationTab === 'bibtex' ? generateBibtex(article) : generateRIS(article))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">
      <Loader size={24} className="animate-spin mr-2" /> Loading article…
    </div>
  )

  if (error || !article) return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <AlertCircle size={36} className="mx-auto text-red-400 mb-3" />
      <p className="font-semibold text-gray-700 mb-1">Article not found</p>
      <p className="text-sm text-gray-500 mb-4">{error}</p>
      <Link to="/archive" className="btn-outline text-sm">← Back to Archive</Link>
    </div>
  )

  const title   = article.title    || 'Untitled'
  const authors = article.authors  || []
  const abstract= article.abstract || ''
  const keywords= article.keywords?.split(',').map(k => k.trim()).filter(Boolean) || []
  const volNum  = article.volume_number || ''
  const issNum  = article.issue_number  || ''
  const year    = article.year || (article.published_at ? new Date(article.published_at).getFullYear() : '')
  const pages   = article.page_start && article.page_end ? `${article.page_start}–${article.page_end}` : ''

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link to="/archive" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 transition-colors">
          <ChevronLeft size={14} /> Back to Archive
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main */}
        <article className="flex-1 min-w-0">
          <div className="card p-8">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-green-100 text-green-700 uppercase tracking-wide">Open Access</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-100 text-blue-700 uppercase tracking-wide">Peer Reviewed</span>
              {article.article_type && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-100 text-gray-600 uppercase tracking-wide">{article.article_type}</span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-navy-900 leading-tight mb-5">{title}</h1>

            {authors.length > 0 && (
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 pb-5 border-b border-gray-100">
                {authors.map(author => (
                  <div key={author.name}>
                    <p className="font-semibold text-navy-900 text-sm">{author.name}</p>
                    <p className="text-xs text-gray-500">{author.affiliation}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500 mb-6">
              {volNum && <span>Vol. {volNum}, Issue {issNum}{year ? `, ${year}` : ''}</span>}
              {pages  && <span>pp. {pages}</span>}
              {article.doi && (
                <span>DOI: <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-600 hover:underline">{article.doi}</a></span>
              )}
              {article.published_at && (
                <span>Published: {new Date(article.published_at).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
              )}
            </div>

            {abstract && (
              <div className="mb-7">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Abstract</h2>
                <p className="text-base leading-relaxed text-gray-700">{abstract}</p>
              </div>
            )}

            {keywords.length > 0 && (
              <div className="mb-8 pb-8 border-b border-gray-100">
                <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Keywords</h2>
                <div className="flex flex-wrap gap-2">
                  {keywords.map(kw => (
                    <Link key={kw} to={`/search?q=${encodeURIComponent(kw)}`}
                      className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:border-navy-400 hover:text-navy-700 transition-colors">
                      {kw}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm text-gray-400 italic">
              Full article text is available via PDF download.
            </p>
          </div>
        </article>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">

          {/* Download */}
          <div className="card p-4">
            {dlError && (
              <p className="text-xs text-red-600 mb-2 flex items-center gap-1">
                <AlertCircle size={11} /> {dlError}
              </p>
            )}
            <button onClick={handleDownload} disabled={downloading}
              className="w-full btn-primary justify-center py-3 text-sm flex items-center gap-2 disabled:opacity-60">
              {downloading ? <><Loader size={14} className="animate-spin" /> Downloading…</> : <><Download size={16} /> Download Full PDF</>}
            </button>
            {!user && (
              <p className="text-xs text-gray-400 text-center mt-2">
                <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to download
              </p>
            )}
          </div>

          {/* Citation Export */}
          <div className="card p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Citation Export</h3>
            <div className="flex border border-gray-200 rounded-md overflow-hidden mb-3">
              {['bibtex', 'ris'].map(tab => (
                <button key={tab} onClick={() => setCitationTab(tab)}
                  className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
                    citationTab === tab ? 'bg-navy-900 text-white' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  {tab === 'bibtex' ? 'BibTeX' : 'RIS'}
                </button>
              ))}
            </div>
            <div className="relative">
              <pre className="bg-gray-50 border border-gray-100 rounded p-3 text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap break-all max-h-40">
                {citationText}
              </pre>
              <button onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                title="Copy to clipboard">
                {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} className="text-gray-500" />}
              </button>
            </div>
          </div>

          {/* Metrics */}
          <div className="card p-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Article Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-3xl font-bold text-navy-900">{(article.download_count || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-0.5">Downloads</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-navy-900">{article.citation_count || 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Citations</p>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Related Articles</h3>
              <div className="space-y-3">
                {related.map(rel => (
                  <Link key={rel.id} to={`/article/${rel.id}`} className="block hover:bg-gray-50 rounded p-2 -mx-2 transition-colors">
                    <p className="text-sm font-medium text-navy-800 hover:text-blue-700 leading-snug">
                      {rel.manuscript?.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Vol. {rel.issue?.volume?.volume_number}, Issue {rel.issue?.issue_number}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {article.doi && (
            <div className="card p-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Links</h3>
              <a href={`https://doi.org/${article.doi}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                <ExternalLink size={13} /> DOI: {article.doi}
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}