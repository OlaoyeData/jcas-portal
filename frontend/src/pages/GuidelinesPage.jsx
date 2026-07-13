import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, Download, CheckSquare, AlertCircle, ChevronRight } from 'lucide-react'

const checklist = [
  'The manuscript has not been published elsewhere and is not under review at another journal.',
  'All co-authors have been listed and have approved the final submission.',
  'The submission file is in PDF or DOCX format and is under 50 MB.',
  'The abstract is between 150–300 words and contains no references.',
  'Up to 8 keywords have been provided, separated by commas.',
  'All figures and tables are embedded in the manuscript file at appropriate positions.',
  'All references follow the IEEE citation format consistently.',
  'Funding acknowledgements and conflict-of-interest statements are included.',
  'For revised manuscripts, a response-to-reviewers document has been attached.',
]

const structure = [
  { label: 'Title', desc: 'Concise and informative; no abbreviations.' },
  { label: 'Abstract', desc: '150–300 words; structured (Background, Methods, Results, Conclusion) for research articles.' },
  { label: 'Keywords', desc: '4–8 terms, comma-separated. Avoid overly general terms.' },
  { label: 'Introduction', desc: 'Context, problem statement, objectives, and paper organisation.' },
  { label: 'Related Work / Literature Review', desc: 'Critical synthesis of prior work; identify research gaps.' },
  { label: 'Methodology', desc: 'Detailed enough to allow replication. Include dataset description and ethical approvals where applicable.' },
  { label: 'Results', desc: 'Objective presentation of findings. Use figures and tables for clarity.' },
  { label: 'Discussion', desc: 'Interpretation of results; comparison with prior work; limitations.' },
  { label: 'Conclusion', desc: 'Summary of contributions and future work directions.' },
  { label: 'References', desc: 'IEEE format. Minimum 20 references for research articles.' },
]

export default function GuidelinesPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Submission</p>
        <h1 className="text-4xl font-display font-bold text-navy-900 mb-3">Author Guidelines</h1>
        <p className="text-gray-500 text-lg">
          Please read all guidelines carefully before submitting your manuscript for peer review.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* File Formats */}
          <section className="card p-6">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-blue-600" /> Accepted File Formats &amp; Limits
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                { fmt: 'PDF (.pdf)', note: 'Preferred format; embed all fonts', size: 'Up to 50 MB' },
                { fmt: 'Word (.docx)', note: 'Acceptable; LaTeX converted to DOCX also accepted', size: 'Up to 50 MB' },
                { fmt: 'Supplementary Files', note: 'ZIP archive for datasets, code, multimedia', size: 'Up to 100 MB' },
              ].map(r => (
                <div key={r.fmt} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="font-semibold text-gray-800">{r.fmt}</p>
                  <p className="text-gray-500 text-xs mt-1">{r.note}</p>
                  <p className="text-blue-600 text-xs font-medium mt-1">{r.size}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Review Model */}
          <section className="card p-6">
            <h2 className="text-base font-bold text-navy-900 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-blue-600" /> Peer Review Model
            </h2>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-800 mb-1">Double-Blind Peer Review</p>
              <p className="text-sm text-blue-700">
                JCAS employs a double-blind review process. Both authors and reviewers remain anonymous to each other throughout the review process. Authors must ensure that their manuscripts do not contain any identifying information (names, affiliations, acknowledgements) in the submitted file.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              {['Submitted', 'Assigned to Editor', 'Reviewer Invited', 'Under Review', 'Decision Issued'].map((step, i) => (
                <React.Fragment key={step}>
                  <div className="text-center">
                    <div className="w-7 h-7 rounded-full bg-navy-900 text-white text-xs flex items-center justify-center font-bold mx-auto mb-1">{i+1}</div>
                    <p className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">{step}</p>
                  </div>
                  {i < 4 && <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Manuscript Structure */}
          <section className="card p-6">
            <h2 className="text-base font-bold text-navy-900 mb-4">Manuscript Structure Requirements</h2>
            <div className="space-y-3">
              {structure.map((s, i) => (
                <div key={s.label} className="flex gap-3 text-sm">
                  <span className="w-6 h-6 rounded-full bg-navy-50 text-navy-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                  <div>
                    <span className="font-semibold text-gray-800">{s.label}: </span>
                    <span className="text-gray-600">{s.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Checklist */}
          <section className="card p-6">
            <h2 className="text-base font-bold text-navy-900 mb-4 flex items-center gap-2">
              <CheckSquare size={16} className="text-green-600" /> Pre-Submission Checklist
            </h2>
            <ul className="space-y-2.5">
              {checklist.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="w-4 h-4 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => {
                const win = window.open('', '_blank')
                win.document.write(`
                  <html>
                  <head>
                    <title>JCAS Pre-Submission Checklist</title>
                    <style>
                      body  { font-family: Arial, sans-serif; max-width: 680px; margin: 48px auto; color: #111; }
                      h1    { font-size: 20px; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 6px; }
                      .sub  { font-size: 12px; color: #666; margin-bottom: 28px; }
                      .item { display: flex; align-items: flex-start; gap: 12px; margin: 10px 0; }
                      .box  { width: 15px; height: 15px; border: 2px solid #555; flex-shrink: 0; margin-top: 2px; }
                      p     { font-size: 13px; margin: 0; line-height: 1.5; }
                      .foot { margin-top: 40px; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
                    </style>
                  </head>
                  <body>
                    <h1>JCAS Pre-Submission Checklist</h1>
                    <p class="sub">Journal of Computing &amp; Applied Sciences &mdash;
                      Please confirm all items before submitting your manuscript.</p>
                    ${checklist.map(item => `
                      <div class="item">
                        <div class="box"></div>
                        <p>${item}</p>
                      </div>
                    `).join('')}
                    <div class="foot">
                      Journal of Computing &amp; Applied Sciences (JCAS) &middot; ${new Date().getFullYear()} &middot;
                      Print this page or save as PDF using your browser&rsquo;s print function.
                    </div>
                  </body>
                  </html>
                `)
                win.document.close()
                win.focus()
                win.print()
              }}
              className="btn-outline mt-5 flex items-center gap-2 text-sm"
            >
              <Download size={14} /> Download Checklist (PDF)
            </button>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5 bg-navy-900 text-white">
            <h3 className="font-bold mb-3">Ready to Submit?</h3>
            <p className="text-sm text-blue-200 mb-4">Submissions are currently open. Start your manuscript submission now.</p>
            <Link to="/dashboard/author/submit" className="block w-full text-center bg-white text-navy-900 font-semibold px-4 py-2.5 rounded-md text-sm hover:bg-blue-50 transition-colors">
              Start Submission
            </Link>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Article Types</h3>
            <ul className="space-y-2 text-sm">
              {[
                { type: 'Research Article', pages: '8–20 pages' },
                { type: 'Review Paper', pages: '12–30 pages' },
                { type: 'Short Communication', pages: '4–8 pages' },
                { type: 'Technical Note', pages: '2–5 pages' },
                { type: 'Letter to the Editor', pages: '1–2 pages' },
              ].map(a => (
                <li key={a.type} className="flex justify-between">
                  <span className="text-gray-700 font-medium">{a.type}</span>
                  <span className="text-gray-400 text-xs mt-0.5">{a.pages}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Current Edition</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Edition',   date: 'Vol. 1, July – Dec 2026' },
                { label: 'Status',    date: 'Submissions Open' },
              ].map(d => (
                <li key={d.label} className="flex justify-between">
                  <span className="text-gray-500">{d.label}</span>
                  <span className="font-semibold text-navy-900 text-xs mt-0.5">{d.date}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Fees</h3>
            <ul className="space-y-2 text-sm mb-4">
              <li className="flex justify-between">
                <span className="text-gray-500">Assessment (on submission)</span>
                <span className="font-semibold text-navy-900 text-xs mt-0.5">₦5,000</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Publication (on acceptance)</span>
                <span className="font-semibold text-navy-900 text-xs mt-0.5">₦30,000</span>
              </li>
              <li className="flex justify-between">
                <span className="text-gray-500">Foreign contributors</span>
                <span className="font-semibold text-navy-900 text-xs mt-0.5">$100</span>
              </li>
            </ul>
            <Link to="/apc" className="text-xs font-semibold text-blue-600 hover:underline">
              View full payment details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
