import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle, Clock, Users, Shield, ChevronDown, ChevronUp } from 'lucide-react'

const steps = [
  {
    number: '01', title: 'Initial Submission',
    description: 'Author submits manuscript through the online portal. Editor-in-Chief performs an initial screening for scope, formatting, and quality threshold within 5 working days.',
  },
  {
    number: '02', title: 'Editor Assignment',
    description: 'A handling editor with relevant expertise is assigned. The editor performs a more detailed assessment and decides whether to send for peer review or desk reject.',
  },
  {
    number: '03', title: 'Reviewer Selection',
    description: 'The editor identifies and invites at least two independent reviewers with expertise in the manuscript\'s subject area. Reviewers have 21 days to complete their assessment.',
  },
  {
    number: '04', title: 'Peer Review',
    description: 'Reviewers evaluate the manuscript on originality, methodological soundness, clarity, and significance. All reviews are conducted double-blind — neither authors nor reviewers know each other\'s identities.',
  },
  {
    number: '05', title: 'Editorial Decision',
    description: 'The editor synthesises reviewer feedback and makes one of four decisions: Accept, Minor Revision, Major Revision, or Reject. The decision and full reviewer comments are sent to the authors.',
  },
  {
    number: '06', title: 'Revision & Publication',
    description: 'If revisions are requested, authors submit a revised manuscript and a point-by-point response to reviewers. Once accepted, the article is typeset and published in the next available issue.',
  },
]

const faqs = [
  {
    q: 'How long does peer review take?',
    a: 'We aim to complete the initial review within 6–8 weeks of submission. Revisions and re-review may add additional time depending on the extent of changes required.',
  },
  {
    q: 'Who are the reviewers?',
    a: 'Reviewers are independent experts in the relevant field, drawn from our reviewer database, editorial board recommendations, and reference lists. They are not affiliated with the authors\' institutions.',
  },
  {
    q: 'What is double-blind review?',
    a: 'In double-blind review, the authors do not know who reviewed their manuscript and the reviewers do not know who the authors are. This reduces bias and ensures fairness.',
  },
  {
    q: 'Can I appeal a rejection?',
    a: 'Yes. Authors who believe their manuscript was rejected in error may submit a formal appeal to the editorial office within 30 days, providing a detailed rebuttal of the reviewers\' concerns.',
  },
  {
    q: 'What happens if reviewers disagree?',
    a: 'When reviewers give conflicting recommendations, the handling editor uses their own expertise to make the final decision, or may seek a third opinion.',
  },
]

export default function PeerReviewPage() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="flex flex-col">

      {/* Hero */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">Editorial Process</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">Peer Review Process</h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-2xl mx-auto">
            JCAS operates a rigorous double-blind peer review process to ensure the quality,
            integrity, and originality of all published research.
          </p>
        </div>
      </section>

      {/* Key facts */}
      <section className="py-10 px-4 bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-5">
          {[
            { icon: Clock,        label: 'Time to First Decision', value: '6–8 Weeks'      },
            { icon: Users,        label: 'Reviewers per Paper',    value: 'At Least 2'     },
            { icon: Shield,       label: 'Review Model',           value: 'Double-Blind'   },
            { icon: CheckCircle,  label: 'Acceptance Rate',        value: '~28%'           },
          ].map(f => {
            const Icon = f.icon
            return (
              <div key={f.label} className="text-center p-5 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                <Icon size={24} className="mx-auto text-blue-600 mb-3" />
                <p className="text-xl font-bold text-navy-900">{f.value}</p>
                <p className="text-xs text-gray-500 mt-1">{f.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-10">Step-by-Step Review Process</h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.number} className="flex gap-5 bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-bold text-navy-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-navy-900 text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-navy-900 text-sm">{faq.q}</span>
                  {openFaq === i ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 px-4 bg-navy-950 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">Ready to Submit?</h2>
        <p className="text-blue-200 text-sm mb-6 max-w-xl mx-auto">
          Read our author guidelines and submit your manuscript for peer review today.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/submit/guidelines" className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors">
            Author Guidelines
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-white/10 transition-colors">
            Submit Manuscript
          </Link>
        </div>
      </section>
    </div>
  )
}