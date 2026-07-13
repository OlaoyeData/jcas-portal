import React from 'react'
import { Link } from 'react-router-dom'
import { Unlock, Globe, BookOpen, DollarSign, Shield, ExternalLink } from 'lucide-react'

export default function OpenAccessPage() {
  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Access Policy</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">Open Access Statement</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
            JCAS is a fully open access journal. All published articles are freely available
            to read, download, and share without subscription or paywall.
          </p>
        </div>
      </section>

      {/* Core statement */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
            {[
              { icon: Unlock,     title: 'Free to Read',    text: 'All articles freely accessible to anyone with an internet connection.'     },
              { icon: Globe,      title: 'Free to Share',   text: 'Articles may be shared and redistributed under CC BY 4.0 terms.'          },
              { icon: BookOpen,   title: 'Free to Reuse',   text: 'Content may be adapted for educational and research purposes with credit.' },
              { icon: DollarSign, title: 'Modest Fees', text: 'A flat assessment and publication fee applies to all authors — see below.'},
            ].map(item => {
              const Icon = item.icon
              return (
                <div key={item.title} className="text-center p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <Icon size={20} className="text-green-700" />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.text}</p>
                </div>
              )
            })}
          </div>

          {/* CC License block */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-7 mb-10">
            <div className="flex items-start gap-4">
              <Shield size={28} className="text-blue-700 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-lg font-bold text-navy-900 mb-2">Creative Commons Attribution 4.0 (CC BY 4.0)</h2>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  All articles published in JCAS are licensed under the Creative Commons Attribution 4.0 International license.
                  This means anyone is free to copy, redistribute, remix, transform, and build upon the published work for any purpose,
                  even commercially, provided appropriate credit is given to the original authors and JCAS.
                </p>
                <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 font-semibold hover:underline">
                  View License Terms <ExternalLink size={13} />
                </a>
              </div>
            </div>
          </div>

          {/* APC Policy */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7 mb-10">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Article Processing Charges (APC)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 pr-4 text-gray-600 font-semibold">Stage</th>
                    <th className="text-left py-2 pr-4 text-gray-600 font-semibold">Fee</th>
                    <th className="text-left py-2 text-gray-600 font-semibold">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-3 pr-4 font-medium text-navy-900">On submission</td>
                    <td className="py-3 pr-4 text-navy-900 font-bold">₦5,000</td>
                    <td className="py-3 text-gray-500 text-xs">Manuscript assessment / review fee</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-navy-900">On acceptance</td>
                    <td className="py-3 pr-4 text-navy-900 font-bold">₦30,000</td>
                    <td className="py-3 text-gray-500 text-xs">Publication fee to cover journal handling costs</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium text-navy-900">Foreign contributors</td>
                    <td className="py-3 pr-4 text-navy-900 font-bold">$100</td>
                    <td className="py-3 text-gray-500 text-xs">Covers both assessment and publication</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Payment is made by bank deposit or online transfer. Full payment details are on the{' '}
              <Link to="/apc" className="text-blue-600 font-semibold hover:underline">APC page</Link>.
            </p>
          </div>

          {/* Self-archiving */}
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <h2 className="text-lg font-bold text-navy-900 mb-3">Self-Archiving Policy</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Authors retain copyright of their work. They are free to post the published version (Version of Record)
              of their article on personal websites, institutional repositories, or preprint servers at any time,
              with a link back to the JCAS article page.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              JCAS supports the Budapest Open Access Initiative and is committed to the principle that
              publicly funded research should be freely available to the public.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-navy-950 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Publish Open Access with JCAS</h2>
        <p className="text-blue-200 text-sm mb-6 max-w-xl mx-auto">
          Join a growing community of researchers sharing their work freely with the world.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/submit/guidelines" className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
            Submission Guidelines
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors">
            Submit Now
          </Link>
        </div>
      </section>
    </div>
  )
}