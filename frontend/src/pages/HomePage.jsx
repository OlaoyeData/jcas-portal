import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FileText, BookOpen, ArrowRight, Info, CheckCircle } from 'lucide-react'
import { archiveApi } from '../services/api'
import { useAnnouncements } from '../contexts/AnnouncementContext'

const stats = [
  { label: 'Published Articles', value: '10+' },
  { label: 'Active Reviewers',   value: '45'  },
  { label: 'Acceptance Rate',    value: '28%' },
  { label: 'Current Issue',      value: 'Vol 1' },
]

export default function HomePage() {
  const [latestArticles, setLatestArticles] = useState([])
  const [displayStats, setDisplayStats] = useState(stats)
  const { announcements } = useAnnouncements()

  useEffect(() => {
    archiveApi.search({ limit: 3 })
      .then(data => setLatestArticles((data || []).slice(0, 3)))
      .catch(() => {})
  }, [])

    useEffect(() => {
    // Keep the placeholder metrics until the journal has a real publication
    // history worth showing. Once there are 20+ published papers, switch
    // to live numbers pulled from the backend.
    archiveApi.publicStats()
      .then(data => {
        if (!data) return
        if (data.published_count >= 20) {
          setDisplayStats([
            { label: 'Published Articles', value: `${data.published_count}+` },
            { label: 'Active Reviewers',   value: String(data.active_reviewers) },
            { label: 'Acceptance Rate',    value: data.acceptance_rate != null ? `${data.acceptance_rate}%` : '—' },
            { label: 'Current Issue',      value: data.current_volume ? `Vol ${data.current_volume}` : '—' },
          ])
        }
        // Below 20 published papers, displayStats stays as the static placeholder.
      })
      .catch(() => {})
  }, [])

  return (
    <>
      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="flex flex-col">
          {announcements.map(a => (
            <div key={a.id} className={`px-4 py-3 text-center text-sm flex items-center justify-center gap-2 flex-wrap ${
              a.type === 'urgent'  ? 'bg-red-600 text-white'   :
              a.type === 'warning' ? 'bg-amber-500 text-white' :
              a.type === 'success' ? 'bg-green-700 text-white' :
              'bg-blue-700 text-white'
            }`}>
              <span className="font-semibold">{a.title}:</span>
              <span>{a.message}</span>
              {a.link && (
                a.link.startsWith('http') ? (
                  <a href={a.link} target="_blank" rel="noopener noreferrer"
                    className="underline font-semibold hover:opacity-80 ml-1">
                    {a.link_text || 'Learn more'} →
                  </a>
                ) : (
                  <Link to={a.link} className="underline font-semibold hover:opacity-80 ml-1">
                    {a.link_text || 'Learn more'} →
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <section className="relative min-h-[540px] flex items-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 pb-36 overflow-hidden">
        <div className="absolute inset-0 opacity-5 overflow-hidden" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none select-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 24 24"
            fill="none" stroke="white" strokeWidth="0.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <ellipse cx="12" cy="12" rx="4" ry="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-blue-600 text-white uppercase tracking-widest">
                  ISSN 2805-3516
                </span>
                <span className="text-sm text-blue-200">Faculty of Computing, Adekunle Ajasin University</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight mb-6">
                Advancing the Frontiers of Computing &amp; Applied Sciences
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed mb-8 max-w-xl">
                A peer-reviewed, open-access journal dedicated to publishing high-quality research,
                theoretical developments, and practical applications across all domains of computer
                science and related applied sciences.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/submit/guidelines"
                  className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg">
                  <FileText size={16} /> Submit Manuscript
                </Link>
                <Link to="/archive"
                  className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/10 transition-colors">
                  <BookOpen size={16} /> Browse Archive
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-white shadow-2xl">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/20">
                  <Info size={16} className="text-blue-300" />
                  <span className="text-sm font-semibold text-blue-100 uppercase tracking-wide">Journal Metrics</span>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  {displayStats.map(s => (
                    <div key={s.label}>
                      <p className="text-3xl font-bold text-white">{s.value}</p>
                      <p className="text-sm text-blue-200 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Publishing options — floating over hero */}
      <div className="relative z-10 -mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen size={22} className="text-navy-700 group-hover:text-white transition-colors" />,
                title: 'Fully Open Access Publishing',
                desc:  'All accepted articles are published under a Creative Commons (CC BY 4.0) licence, freely accessible to readers worldwide at no cost to authors.',
                link:  '/about',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="text-navy-700 group-hover:text-white transition-colors">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                  </svg>
                ),
                title: 'Rigorous Double-Blind Peer Review',
                desc:  'Every submission undergoes a structured double-blind review by at least two domain experts, ensuring impartial and thorough evaluation of all manuscripts.',
                link:  '/about',
              },
              {
                icon: <FileText size={22} className="text-navy-700 group-hover:text-white transition-colors" />,
                title: 'Author Resources & Submission Portal',
                desc:  'From manuscript preparation guidelines to a step-by-step online submission wizard, JCAS provides everything researchers need to publish their work efficiently.',
                link:  '/submit/guidelines',
              },
            ].map(card => (
              <div key={card.title}
                className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group">
                <div className="w-12 h-12 rounded-lg bg-navy-50 flex items-center justify-center mb-4 group-hover:bg-navy-900 transition-colors">
                  {card.icon}
                </div>
                <h3 className="text-sm font-bold text-navy-900 mb-2">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{card.desc}</p>
                <Link to={card.link} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Learn More <ArrowRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call for Papers */}
      <section className="relative bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="w-full lg:w-[65%] overflow-hidden rounded-sm">
              <div className="relative bg-navy-950 h-[400px] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'linear-gradient(rgba(59,130,246,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.5) 1px, transparent 1px)',
                  backgroundSize: '28px 28px'
                }} />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'radial-gradient(circle, rgba(147,197,253,0.9) 1.5px, transparent 1.5px)',
                  backgroundSize: '28px 28px'
                }} />
                <svg className="relative z-10 opacity-25" width="320" height="320" viewBox="0 0 24 24"
                  fill="none" stroke="white" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at 55% 50%, rgba(59,130,246,0.3) 0%, transparent 65%)' }} />
              </div>
            </div>
            <div className="lg:absolute lg:right-0 lg:top-1/2 lg:-translate-y-1/2 bg-white shadow-xl p-8 lg:p-10 w-full lg:w-[42%] mt-0">
              <h2 className="text-2xl font-bold text-navy-900 mb-3">Call for Papers</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Browse our fully open-access computing and applied science journal and submit your manuscript.
                We welcome original research, reviews, and technical communications from researchers worldwide.
              </p>
              <Link to="/submit/guidelines"
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-sm font-semibold text-sm transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About JCAS */}
      <section className="relative bg-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-end">
            <div className="w-full lg:w-[65%] overflow-hidden rounded-sm">
              <div className="relative bg-slate-700 h-[400px] overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-600 via-slate-700 to-slate-900" />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                  backgroundSize: '40px 40px'
                }} />
                <div className="relative z-10 text-center text-white/30">
                  <BookOpen size={72} strokeWidth={0.7} />
                  <p className="text-xs mt-2 tracking-widest uppercase">Researcher Image</p>
                </div>
              </div>
            </div>
            <div className="lg:absolute lg:left-0 lg:top-1/2 lg:-translate-y-1/2 bg-white shadow-xl p-8 lg:p-10 w-full lg:w-[42%] mt-0">
              <h2 className="text-2xl font-bold text-navy-900 mb-3">About JCAS</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                Many researchers today want their work freely accessible to all reader communities.
                To help authors gain maximum visibility for their groundbreaking research, JCAS provides
                fully open-access publishing under Creative Commons licensing — meeting the needs of
                authors, institutions, and readers across Africa and beyond.
              </p>
              <Link to="/about"
                className="inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-sm font-semibold text-sm transition-colors">
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* APC Section */}
      <section className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-navy-900 mb-3">Article Processing Charge</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm leading-relaxed mb-8">
            JCAS charges a small assessment fee on submission and a publication fee upon acceptance
            to cover journal handling costs. See the full breakdown, payment details, and editorial
            contacts on the APC page.
          </p>
          <Link to="/apc"
            className="inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white px-6 py-3 rounded-md font-semibold text-sm transition-colors">
            <FileText size={15} /> View APC Details
          </Link>
        </div>
      </section>

      {/* Latest Published Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Latest Published Articles</h2>
            <p className="text-sm text-gray-500 mt-1">Recently published open-access research</p>
          </div>
          <Link to="/archive" className="btn-outline flex items-center gap-1.5 text-sm">
            View All Issues <ArrowRight size={14} />
          </Link>
        </div>

        <div className="space-y-4">
          {latestArticles.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 text-sm">
              No articles published yet.
            </div>
          ) : latestArticles.map(article => (
            <div key={article.id} className="card p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-wrap items-start gap-2 mb-3">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700">
                  OPEN ACCESS
                </span>
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                  {article.article_type}
                </span>
              </div>
              <Link to={`/article/${article.id}`}>
                <h3 className="text-lg font-semibold text-navy-900 hover:text-blue-700 transition-colors leading-snug mb-2">
                  {article.title || 'Untitled'}
                </h3>
              </Link>
              <p className="text-sm text-gray-500 mb-3">
                {(article.authors || []).map(a => a.name).join(', ')}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-4">
                {article.abstract || ''}
              </p>
              <div className="flex items-center gap-3">
                {article.doi && <span className="text-xs text-gray-400">DOI: {article.doi}</span>}
                <div className="ml-auto">
                  <Link to={`/article/${article.id}`}
                    className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1">
                    <FileText size={12} /> View Article
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}