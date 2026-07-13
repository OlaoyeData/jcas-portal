import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, Send, ArrowUpRight, Copy, Check,
  Mail, MessageCircle, Building2, CreditCard, FileText, Globe
} from 'lucide-react'

const feeTiers = [
  {
    title:     'Manuscript Assessment',
    subtitle:  'Payable on submission',
    price:     '₦5,000',
    highlight: false,
    color:     'border-t-4 border-blue-400',
    items: [
      'Initial editorial screening',
      'Plagiarism / similarity check',
      'Assignment to peer reviewers',
      'Double-blind peer review',
    ],
  },
  {
    title:     'Publication Fee',
    subtitle:  'Payable after acceptance',
    price:     '₦30,000',
    highlight: true,
    color:     'border-t-4 border-navy-600',
    items: [
      'Journal handling & production',
      'DOI assignment',
      'Open-access publication',
      'Permanent archival & indexing',
    ],
  },
  {
    title:     'Foreign Contributors',
    subtitle:  'Authors outside Nigeria',
    price:     '$100',
    highlight: false,
    color:     'border-t-4 border-blue-400',
    items: [
      'Covers assessment + publication',
      'Same peer-review standard',
      'Same open-access terms',
      'Contact editors for payment options',
    ],
  },
]

const bankDetails = [
  { label: 'Account Name',   value: 'JCAS' },
  { label: 'Account Number', value: '1140280986' },
  { label: 'Bank Name',      value: 'Polaris Bank' },
]

export default function APCPage() {
  const [copiedField, setCopiedField] = useState(null)

  const handleCopy = (label, value) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(label)
      setTimeout(() => setCopiedField(null), 1500)
    })
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">
            ISSN: 2805-3516
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Article Processing Charge
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
            JCAS is a rapid but thorough peer-reviewed, university-based journal published by the
            Faculty of Computing, Adekunle Ajasin University, Akungba-Akoko, Ondo State, Nigeria.
            Below is a full breakdown of assessment and publication fees.
          </p>
        </div>
      </section>

      {/* ── Fee tiers ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {feeTiers.map(tier => (
              <div key={tier.title}
                className={`bg-white rounded-xl shadow-sm p-6 border border-gray-100 ${tier.color} ${tier.highlight ? 'ring-2 ring-navy-600 shadow-md' : ''}`}>
                {tier.highlight && (
                  <span className="inline-block text-xs font-bold bg-navy-900 text-white px-2 py-0.5 rounded mb-3 uppercase tracking-wider">
                    On Acceptance
                  </span>
                )}
                <h3 className="font-bold text-navy-900 mb-0.5">{tier.title}</h3>
                <p className="text-xs text-gray-400 mb-3">{tier.subtitle}</p>
                <p className={`text-3xl font-extrabold mb-4 ${tier.highlight ? 'text-navy-700' : 'text-gray-800'}`}>
                  {tier.price}
                </p>
                <ul className="space-y-2">
                  {tier.items.map(item => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center max-w-2xl mx-auto">
            Fees are subject to change. The rate confirmed at the time of submission (assessment fee)
            or acceptance (publication fee) applies to your manuscript.
          </p>
        </div>
      </section>

      {/* ── Payment details ───────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">

          {/* Bank details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={18} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">How to Pay</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Payment should be made by bank deposit or online transfer to:
            </p>
            <div className="space-y-3">
              {bankDetails.map(d => (
                <div key={d.label}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">{d.label}</p>
                    <p className="text-sm font-semibold text-navy-900">{d.value}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(d.label, d.value)}
                    className="flex items-center gap-1 text-xs font-semibold text-navy-700 hover:text-navy-900 px-2.5 py-1.5 rounded-md hover:bg-white transition-colors flex-shrink-0"
                  >
                    {copiedField === d.label
                      ? <><Check size={12} className="text-green-600" /> Copied</>
                      : <><Copy size={12} /> Copy</>
                    }
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
              <CreditCard size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                After paying, a scanned copy or screenshot of your payment details should be forwarded to{' '}
                <a href="mailto:sraeditor@aaua.edu.ng" className="font-semibold underline">sraeditor@aaua.edu.ng</a>.
                You'll also upload proof of payment through your author dashboard after submitting or when
                notified of acceptance.
              </p>
            </div>
          </div>

          {/* Contact / enquiries */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-1">
              <FileText size={18} className="text-navy-700" />
              <h2 className="font-bold text-navy-900">Editorial Contacts</h2>
            </div>
            <p className="text-xs text-gray-500 mb-5">
              For all further enquiries about payment, submissions, or the review process.
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-navy-900">Prof. S.O. Olatunji</p>
                <p className="text-xs text-gray-500">Editor-in-Chief</p>
              </div>
              <div>
                <p className="text-sm font-bold text-navy-900">Dr. F.O. Aranuwa</p>
                <p className="text-xs text-gray-500">Managing Editor</p>
              </div>

              <div className="pt-3 border-t border-gray-100 space-y-2.5">
                <a href="mailto:jcaseditor@aaua.edu.ng"
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-navy-900 transition-colors">
                  <Mail size={14} className="text-blue-500 flex-shrink-0" />
                  jcaseditor@aaua.edu.ng
                </a>
                <a href="https://wa.me/2347031341911" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-navy-900 transition-colors">
                  <MessageCircle size={14} className="text-green-500 flex-shrink-0" />
                  WhatsApp: +234 703 134 1911
                </a>
                <a href="https://journals.aaua.edu.ng/jcas" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-navy-900 transition-colors">
                  <Globe size={14} className="text-navy-500 flex-shrink-0" />
                  journals.aaua.edu.ng/jcas
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative py-20 px-4 bg-navy-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(147,197,253,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative z-10 text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Submit?</h2>
          <p className="text-blue-200 mb-8 text-sm leading-relaxed">
            Manuscripts for the Vol. 1 (July – Dec 2026) edition can be submitted electronically
            through the author portal, or by email to jcaseditor@aaua.edu.ng.
          </p>
          <Link to="/submit/guidelines"
            className="inline-flex items-center gap-2 bg-white text-navy-900 px-8 py-3 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors shadow-xl">
            <Send size={15} /> Submit Your Manuscript <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>

    </div>
  )
}