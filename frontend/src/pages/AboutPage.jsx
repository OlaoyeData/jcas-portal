import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Mail, Globe, Shield, BookOpen, ChevronRight, ArrowUpRight,
  Clock, CheckCircle, Calendar, Lock, Unlock, Library,
  Users, FileText, Layers, ChevronDown, ExternalLink, Send
} from 'lucide-react'

const scope = [
  'Artificial Intelligence & Machine Learning',
  'Computer Networks & Distributed Systems',
  'Cybersecurity & Privacy',
  'Database Systems & Big Data',
  'Human-Computer Interaction',
  'Quantum Computing',
  'Software Engineering & Formal Methods',
  'Computer Vision & Image Processing',
  'Natural Language Processing',
  'Internet of Things & Edge Computing',
]

const metrics = [
  { label: 'Submission to Decision',  value: '6 to 8 Weeks',  icon: Clock        },
  { label: 'Average Acceptance Rate', value: '~28%',          icon: CheckCircle  },
  { label: 'Frequency',               value: 'Quarterly',     icon: Calendar     },
  { label: 'Review Model',            value: 'Double-Blind',  icon: Lock         },
  { label: 'Format',                  value: 'Open Access',   icon: Unlock       },
  { label: 'Launched',                value: 'Vol. 1, 2026',  icon: Library      },
]

const faqs = [
  {
  question: 'Is there an article processing charge (APC)?',
  answer:   'Yes. A ₦5,000 assessment fee is payable on submission, and a ₦30,000 publication fee applies once a manuscript is accepted. Foreign contributors pay $100 to cover both. See the APC page for full payment details.',
  link:     '/apc',
  linkText: 'APC Details',
},
  {
    question: 'Does rapid peer review compromise quality?',
    answer:   'No. All submissions undergo rigorous double-blind review by at least two domain experts, regardless of turnaround time. Editors monitor review quality closely throughout the process.',
    link:     '/submit/guidelines',
    linkText: 'About Peer Review',
  },
  {
    question: 'What are the criteria for acceptance?',
    answer:   'Manuscripts are evaluated on originality, methodological soundness, clarity of presentation, and significance of contribution to the field of computing and applied sciences.',
    link:     '/submit/guidelines',
    linkText: 'Author Guidelines',
  },
]

const editorialBoard = [
  { name: 'Dr. F.O. Aranuwa', role: 'Editor-in-Chief', affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Prof. S.O. Olatunji',    role: 'Managing Editor',  affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Prof. A.O. Akingbesote',    role: 'Editor',  affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Dr. O.O. Ajayi',    role: 'Editor',  affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Dr. Mrs. E.O Aliyu',    role: 'Editor',  affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Dr. D.A Akinwunmi',    role: 'Editor',  affiliation: 'Adekunle Ajasin University, Akungba-Akoko', expertise: '' },
  { name: 'Prof. G.B. Iwasokun',    role: 'Editor',  affiliation: 'Fedral University of Technology Akure', expertise: '' },
  { name: 'Prof. Sellapan Palaniappan',    role: 'Editor',  affiliation: 'Fedral University of Technology Akure', expertise: '' },
]

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-3">About JCAS</p>
          <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Journal of Computing &amp;<br className="hidden sm:block" /> Applied Sciences
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-3xl mx-auto mb-8">
            A peer-reviewed, open-access journal published quarterly by the Faculty of Computing,
            Adekunle Ajasin University. Serving as a platform for researchers, academics, and
            practitioners worldwide to publish and disseminate original research.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/submit/guidelines"
              className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-md font-semibold text-sm hover:bg-blue-50 transition-colors shadow-lg">
              <Send size={15} /> Submit a Manuscript
            </Link>
            <Link to="/archive"
              className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-6 py-3 rounded-md font-semibold text-sm hover:bg-white/10 transition-colors">
              <BookOpen size={15} /> Browse Archive
            </Link>
          </div>
        </div>
      </section>

      {/* ── Broad Scope ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">

          {/* Left */}
          <div>
            {/* Decorative banner */}
            <div className="relative bg-navy-950 rounded-xl overflow-hidden h-52 mb-6 flex items-center justify-center">
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: 'linear-gradient(rgba(59,130,246,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,.5) 1px, transparent 1px)',
                backgroundSize: '28px 28px'
              }} />
              <div className="relative z-10 text-center text-white px-6">
                <BookOpen size={40} className="mx-auto mb-3 text-blue-300 opacity-60" />
                <p className="text-lg font-bold text-white">ISSN 2805-3516</p>
                <p className="text-blue-300 text-sm mt-1">Faculty of Computing, Adekunle Ajasin University</p>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4">
              JCAS publishes high-quality original research articles, review papers, and short
              communications across all domains of computer science and related applied sciences.
              The journal is committed to rapid peer review and broad open-access dissemination.
            </p>
            <p className="text-gray-600 leading-relaxed">
              All published articles are freely available under a Creative Commons Attribution
              (CC BY 4.0) license, ensuring maximum visibility and impact for authors' work.
            </p>
          </div>

          {/* Right: Scope list */}
          <div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Broad Scope</h2>
            <p className="text-gray-500 text-sm mb-6">
              JCAS welcomes submissions across all areas of computing and applied sciences,
              with particular emphasis on:
            </p>
            <div className="space-y-2">
              {scope.map(item => (
                <div key={item}
                  className="flex items-start gap-3 p-3 border-l-2 border-blue-500 bg-blue-50 rounded-r-lg">
                  <ChevronRight size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── At a Glance ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-10 items-start">

            {/* Left label */}
            <div className="lg:w-64 flex-shrink-0">
              <h2 className="text-3xl font-bold text-navy-900 mb-3">At a Glance</h2>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">
                Key facts and figures about the Journal of Computing &amp; Applied Sciences.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/submit/guidelines"
                  className="inline-flex items-center gap-2 bg-navy-900 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors">
                  Author Guidelines <ArrowUpRight size={14} />
                </Link>
                <Link to="/archive"
                  className="inline-flex items-center gap-2 border-2 border-navy-900 text-navy-900 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-navy-50 transition-colors">
                  Browse Issues <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {metrics.map(m => {
                const Icon = m.icon
                return (
                  <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                    <Icon size={28} className="mx-auto mb-3 text-blue-600" />
                    <p className="text-xs text-gray-500 mb-1">{m.label}</p>
                    <p className="text-base font-bold text-navy-900">{m.value}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Publication Ethics ────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-navy-900 mb-3">Publication Ethics &amp; Policies</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm">
              JCAS upholds the highest standards of research integrity and publication ethics.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Shield,
                title: 'Plagiarism Policy',
                text: 'All submissions are screened. Similarity index exceeding 20% results in return for revision before peer review.',
              },
              {
                icon: Users,
                title: 'Authorship',
                text: 'All listed authors must have made substantial contributions. The corresponding author ensures co-author approval.',
              },
              {
                icon: FileText,
                title: 'Conflicts of Interest',
                text: 'Authors must disclose any financial or personal relationships that could influence the work. Reviewers must recuse themselves when conflicts exist.',
              },
              {
                icon: Unlock,
                title: 'Open Access Policy',
                text: 'All published articles are freely available under CC BY 4.0. No APCs for authors affiliated with Adekunle Ajasin University.',
              },
            ].map(card => {
              const Icon = card.icon
              return (
                <div key={card.title} className="border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <Icon size={18} className="text-blue-600" />
                  </div>
                  <h3 className="font-bold text-navy-900 text-sm mb-2">{card.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{card.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Editorial Board ───────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-navy-900 mb-3">Editorial Board</h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              Our editorial team comprises leading researchers and academics from institutions across Nigeria and beyond.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {editorialBoard.map(member => (
              <div key={member.name} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                <div className="w-11 h-11 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold mb-4">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-bold text-gray-900 leading-snug">{member.name}</p>
                <p className="text-xs font-semibold text-blue-600 mt-1">{member.role}</p>
                <p className="text-xs text-gray-500 mt-1">{member.affiliation}</p>
                {member.expertise && (
                  <p className="text-xs text-gray-400 mt-1 italic">{member.expertise}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Indexed In ────────────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-6">Indexed In</p>
          <div className="flex flex-wrap justify-center gap-4">
            {['Google Scholar', 'CrossRef', 'DOAJ', 'African Journals Online (AJOL)', 'EBSCOhost'].map(idx => (
              <div key={idx}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors">
                <Globe size={13} className="text-blue-500" /> {idx}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-navy-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                <h3 className="font-bold text-white text-sm leading-snug mb-3">{faq.question}</h3>
                <p className="text-blue-200 text-xs leading-relaxed mb-4">{faq.answer}</p>
                <Link to={faq.link}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-300 hover:text-white transition-colors">
                  {faq.linkText} <ArrowUpRight size={12} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Need Help CTA ─────────────────────────────────────────────── */}
      <section className="relative py-24 px-4 bg-navy-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle, rgba(147,197,253,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />
        <div className="relative z-10 text-center max-w-xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-3">Need Help?</h2>
      <p className="text-blue-200 mb-8">Contact our editorial team for assistance with submissions, peer review, or general enquiries.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a href="mailto:jcaseditor@aaua.edu.ng"
          className="inline-flex items-center justify-center gap-2 bg-white text-navy-900 px-8 py-3 rounded-full font-semibold text-sm hover:bg-blue-50 transition-colors shadow-xl">
          Get in Touch <ArrowUpRight size={15} />
        </a>
        <a href="https://wa.me/2347031341911" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 border border-white/40 text-white px-8 py-3 rounded-full font-semibold text-sm hover:bg-white/10 transition-colors">
          WhatsApp: +234 703 134 1911
        </a>
      </div>
      </div>
      </section>

      {/* ── Footer strip ──────────────────────────────────────────────── */}
      <section className="py-8 px-4 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap justify-center">
            <Mail size={14} className="text-blue-500" />
            <span>jcaseditor@aaua.edu.ng</span>
            <span className="text-gray-300 mx-2">·</span>
            <span>Faculty of Computing, Adekunle Ajasin University, Akungba-Akoko, Ondo State, Nigeria</span>
          </div>
          <div className="flex gap-3">
            <Link to="/submit/guidelines"
              className="inline-flex items-center gap-1.5 bg-navy-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-800 transition-colors">
              Submit an Article <ExternalLink size={13} />
            </Link>
            <Link to="/archive"
              className="inline-flex items-center gap-1.5 border border-navy-900 text-navy-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-navy-50 transition-colors">
              View Published Articles <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}