import React from 'react'
import { Link } from 'react-router-dom'
import { Globe, CheckCircle, ExternalLink } from 'lucide-react'

const indexes = [
  {
    name: 'Google Scholar',
    description: 'All JCAS articles are indexed and searchable on Google Scholar, providing broad visibility to the global research community.',
    status: 'Active',
    url: 'https://scholar.google.com',
  },
  {
    name: 'CrossRef',
    description: 'DOIs are registered with CrossRef, enabling persistent article identification and citation tracking across publishers.',
    status: 'Active',
    url: 'https://www.crossref.org',
  },
  {
    name: 'African Journals Online (AJOL)',
    description: 'JCAS is listed on AJOL, the largest and most comprehensive online platform for African-published research journals.',
    status: 'Active',
    url: 'https://www.ajol.info',
  },
  {
    name: 'DOAJ — Directory of Open Access Journals',
    description: 'JCAS is indexed in DOAJ, the gold standard directory for quality open access journals worldwide.',
    status: 'Active',
    url: 'https://doaj.org',
  },
  {
    name: 'ResearchGate',
    description: 'JCAS articles and authors are listed on ResearchGate, the largest professional network for researchers with over 25 million members. Authors can track article reads, citations, and recommendations in real time.',
    status: 'Active',
    url: 'https://www.researchgate.net',
  },
  {
    name: 'EBSCOhost',
    description: 'Articles are available through the EBSCO database platform used by libraries and academic institutions worldwide.',
    status: 'Active',
    url: 'https://www.ebsco.com',
  },
  {
    name: 'Scopus',
    description: 'Application for Scopus indexing is currently under review. Scopus is one of the world\'s largest abstract and citation databases.',
    status: 'Pending',
    url: 'https://www.scopus.com',
  },
  {
    name: 'Web of Science',
    description: 'Application for Web of Science indexing has been submitted. WoS is a premium citation database for high-impact research.',
    status: 'Pending',
    url: 'https://www.webofscience.com',
  },
]

export default function IndexingPage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Discoverability</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">Indexing & Abstracting</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
            JCAS is indexed in multiple international databases to ensure maximum visibility
            and discoverability of published research.
          </p>
        </div>
      </section>

      {/* Index list */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-5">
            {indexes.map(idx => (
              <div key={idx.name} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-blue-600 flex-shrink-0" />
                    <h3 className="font-bold text-navy-900 text-sm leading-snug">{idx.name}</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
                    idx.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {idx.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-3">{idx.description}</p>
                <a href={idx.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium">
                  Visit <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-8">Why Indexing Matters</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { title: 'Global Visibility',   text: 'Indexed articles reach millions of researchers worldwide through database searches.' },
              { title: 'Citation Tracking',   text: 'CrossRef DOIs allow accurate citation counting and impact measurement.'              },
              { title: 'Library Access',      text: 'Institutional subscriptions to databases give students and researchers easy access.'   },
            ].map(b => (
              <div key={b.title} className="bg-white border border-gray-100 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <CheckCircle size={24} className="mx-auto text-green-600 mb-3" />
                <h3 className="font-bold text-navy-900 text-sm mb-2">{b.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{b.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-navy-950 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Get Your Research Indexed</h2>
        <p className="text-blue-200 text-sm mb-6">Submit your manuscript to JCAS and benefit from our indexing partnerships.</p>
        <Link to="/login" className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
          Submit Manuscript
        </Link>
      </section>
    </div>
  )
}