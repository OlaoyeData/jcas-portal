import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Upload, X, Plus, AlertCircle, Loader } from 'lucide-react'
import { manuscriptsApi, subjectsApi } from '../../services/api'

const STEPS = [
  { number: 1, label: 'Details' },
  { number: 2, label: 'Authors' },
  { number: 3, label: 'Files' },
  { number: 4, label: 'Policy' },
  { number: 5, label: 'Review' },
]


const articleTypes = ['Research Article', 'Review Paper', 'Short Communication', 'Technical Note', 'Letter to the Editor']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, i) => (
        <React.Fragment key={step.number}>
          <div className="flex flex-col items-center">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
              step.number < current ? 'bg-navy-900 border-navy-900 text-white' :
              step.number === current ? 'bg-navy-900 border-navy-900 text-white' :
              'border-gray-300 text-gray-400 bg-white'
            }`}>
              {step.number < current ? <Check size={14} /> : step.number}
            </div>
            <p className={`text-xs mt-1.5 font-medium ${step.number <= current ? 'text-navy-900' : 'text-gray-400'}`}>
              {step.label}
            </p>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 sm:w-24 h-0.5 mb-5 mx-1 ${step.number < current ? 'bg-navy-900' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function Step1({ data, onChange, errors, subjectAreas }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-navy-900 pb-3 border-b border-gray-100">Manuscript Details</h3>

      <div>
        <label className="form-label">Manuscript Title <span className="text-red-500">*</span></label>
        <input type="text" value={data.title} onChange={e => onChange('title', e.target.value)}
          placeholder="Enter the full title of your manuscript"
          className={`form-input ${errors.title ? 'border-red-400' : ''}`} />
        {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="form-label">Article Type <span className="text-red-500">*</span></label>
        <select value={data.articleType} onChange={e => onChange('articleType', e.target.value)}
          className={`form-input ${errors.articleType ? 'border-red-400' : ''}`}>
          <option value="">Select article type</option>
          {articleTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.articleType && <p className="text-xs text-red-600 mt-1">{errors.articleType}</p>}
      </div>

      <div>
        <label className="form-label">Subject Area <span className="text-red-500">*</span></label>
        <select value={data.subjectArea} onChange={e => onChange('subjectArea', e.target.value)} className="form-input">
          <option value="">Select subject area</option>
          {subjectAreas.map(s => <option key={s.id} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      <div>
        <label className="form-label">Abstract <span className="text-red-500">*</span> <span className="text-gray-400 normal-case font-normal">(max 300 words)</span></label>
        <textarea value={data.abstract} onChange={e => onChange('abstract', e.target.value)} rows={7}
          placeholder="Enter your abstract here (max 300 words)"
          className={`form-input resize-y ${errors.abstract ? 'border-red-400' : ''}`} />
        <div className="flex justify-between mt-1">
          {errors.abstract ? <p className="text-xs text-red-600">{errors.abstract}</p> : <span />}
          <p className={`text-xs ${data.abstract.split(/\s+/).filter(Boolean).length > 300 ? 'text-red-500' : 'text-gray-400'}`}>
            {data.abstract.split(/\s+/).filter(Boolean).length} / 300 words
          </p>
        </div>
      </div>

      <div>
        <label className="form-label">Keywords <span className="text-red-500">*</span> <span className="text-gray-400 normal-case font-normal">(comma-separated, up to 8)</span></label>
        <input type="text" value={data.keywords} onChange={e => onChange('keywords', e.target.value)}
          placeholder="e.g., machine learning, neural networks, computer vision"
          className={`form-input ${errors.keywords ? 'border-red-400' : ''}`} />
        {errors.keywords && <p className="text-xs text-red-600 mt-1">{errors.keywords}</p>}
        {data.keywords && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.keywords.split(',').map(k => k.trim()).filter(Boolean).slice(0, 8).map(k => (
              <span key={k} className="text-xs bg-navy-50 text-navy-700 border border-navy-200 px-2 py-0.5 rounded">{k}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Step2({ data, onChange }) {
  const addCoAuthor = () => {
    onChange('coAuthors', [...data.coAuthors, { name: '', email: '', affiliation: '', corresponding: false }])
  }
  const removeCoAuthor = (i) => {
    onChange('coAuthors', data.coAuthors.filter((_, idx) => idx !== i))
  }
  const updateCoAuthor = (i, field, value) => {
    const updated = [...data.coAuthors]
    updated[i] = { ...updated[i], [field]: value }
    onChange('coAuthors', updated)
  }

  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-navy-900 pb-3 border-b border-gray-100">Authors</h3>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 flex items-start gap-2">
        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
        The submitting user is automatically listed as the first author. Add co-authors below.
      </div>

      {data.coAuthors.map((author, i) => (
        <div key={i} className="card p-4 relative">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Co-Author {i + 1}</p>
            <button onClick={() => removeCoAuthor(i)} className="text-gray-400 hover:text-red-500 transition-colors">
              <X size={15} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Full Name</label>
              <input type="text" value={author.name} onChange={e => updateCoAuthor(i, 'name', e.target.value)}
                placeholder="Dr. Jane Smith" className="form-input" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" value={author.email} onChange={e => updateCoAuthor(i, 'email', e.target.value)}
                placeholder="jane@institution.edu" className="form-input" />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Affiliation</label>
              <input type="text" value={author.affiliation} onChange={e => updateCoAuthor(i, 'affiliation', e.target.value)}
                placeholder="University / Research Institute" className="form-input" />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-3 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={author.corresponding} onChange={e => updateCoAuthor(i, 'corresponding', e.target.checked)}
              className="rounded border-gray-300 text-navy-700" />
            Mark as corresponding author
          </label>
        </div>
      ))}

      <button onClick={addCoAuthor} className="btn-outline flex items-center gap-2 text-sm">
        <Plus size={15} /> Add Co-Author
      </button>
    </div>
  )
}

function FileUploadBox({ label, required, accept, hint, file, onSet, onClear }) {
  const [dragging, setDragging] = useState(false)
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) onSet(f)
  }
  return (
    <div>
      <label className="form-label">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-5 text-center transition-colors ${dragging ? 'border-navy-500 bg-navy-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 bg-navy-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Upload size={16} className="text-navy-700" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={onClear} className="ml-2 text-gray-400 hover:text-red-500 flex-shrink-0">
              <X size={15} />
            </button>
          </div>
        ) : (
          <>
            <Upload size={22} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs text-gray-500 mb-2">{hint}</p>
            <label className="btn-outline text-xs cursor-pointer py-1.5 px-3">
              Browse
              <input type="file" accept={accept} onChange={e => onSet(e.target.files[0])} className="sr-only" />
            </label>
          </>
        )}
      </div>
    </div>
  )
}

function Step3({ data, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-navy-900 pb-3 border-b border-gray-100">File Upload</h3>

      <FileUploadBox
        label="Main Manuscript File"
        required
        accept=".pdf,.docx"
        hint="PDF or DOCX — up to 50 MB"
        file={data.mainFile}
        onSet={f => onChange('mainFile', f)}
        onClear={() => onChange('mainFile', null)}
      />

      <FileUploadBox
        label="Cover Letter"
        accept=".pdf,.docx,.txt"
        hint="PDF, DOCX or TXT — up to 10 MB"
        file={data.coverLetter}
        onSet={f => onChange('coverLetter', f)}
        onClear={() => onChange('coverLetter', null)}
      />

      <FileUploadBox
        label="Highlights"
        accept=".pdf,.docx,.txt"
        hint="3–5 bullet-point highlights of your findings. PDF, DOCX or TXT — up to 5 MB"
        file={data.highlights}
        onSet={f => onChange('highlights', f)}
        onClear={() => onChange('highlights', null)}
      />

      <FileUploadBox
        label="Title Page"
        accept=".pdf,.docx"
        hint="Title page with author affiliations (blinded separately from main file). PDF or DOCX — up to 5 MB"
        file={data.titlePage}
        onSet={f => onChange('titlePage', f)}
        onClear={() => onChange('titlePage', null)}
      />

      <div>
        <label className="form-label">Supplementary Files</label>
        <label className="btn-outline text-sm cursor-pointer flex items-center gap-2 w-fit">
          <Plus size={14} /> Add Supplementary File
          <input type="file" multiple onChange={() => {}} className="sr-only" />
        </label>
        <p className="text-xs text-gray-500 mt-1">ZIP archives for datasets, code, or multimedia. Up to 100 MB.</p>
      </div>
    </div>
  )
}

function Step4({ data, onChange }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-navy-900 pb-3 border-b border-gray-100">Policy Acknowledgement</h3>
      <p className="text-sm text-gray-600">
        Please read the following submission policies before proceeding.
      </p>

      {/* Policy summary — read only */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
        {[
          'This manuscript is original and has not been published elsewhere, and is not currently under review at any other journal.',
          'The manuscript has not been submitted to any other publication simultaneously.',
          'All authors have agreed to this submission and consent to transfer copyright upon acceptance.',
          'The research was conducted in accordance with applicable ethical standards and guidelines.',
          'All listed authors have made substantial contributions to the work and have approved the final manuscript.',
        ].map((text, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
            <span className="font-semibold text-navy-700 flex-shrink-0">{i + 1}.</span>
            <span>{text}</span>
          </div>
        ))}
      </div>

      {/* Single acknowledgement checkbox */}
      <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-navy-200 bg-navy-50 hover:bg-navy-100 cursor-pointer transition-colors">
        <input
          type="checkbox"
          checked={data.allPoliciesAgreed || false}
          onChange={e => onChange('allPoliciesAgreed', e.target.checked)}
          className="mt-0.5 rounded border-navy-400 text-navy-700 flex-shrink-0 w-4 h-4"
        />
        <span className="text-sm font-medium text-navy-900 leading-relaxed">
          I have read and agree to all of the above submission policies on behalf of all co-authors.
        </span>
      </label>
    </div>
  )
}

function Step5({ formData }) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-bold text-navy-900 pb-3 border-b border-gray-100">Review & Submit</h3>
      <p className="text-sm text-gray-600 mb-4">Please review your submission before finalising.</p>

      {[
        { label: 'Title',       value: formData.details.title       || <em className="text-red-500">Not provided</em> },
        { label: 'Article Type',value: formData.details.articleType || <em className="text-red-500">Not selected</em> },
        { label: 'Subject Area',value: formData.details.subjectArea || <em className="text-gray-400">Not selected</em> },
        { label: 'Keywords',    value: formData.details.keywords    || <em className="text-gray-400">None</em> },
        { label: 'Co-Authors',  value: formData.authors.coAuthors.length === 0 ? 'None' : `${formData.authors.coAuthors.length} co-author(s)` },
        { label: 'Main File',   value: formData.files.mainFile?.name || <em className="text-red-500">No file uploaded</em> },
      ].map(row => (
        <div key={row.label} className="flex gap-4 py-2.5 border-b border-gray-50 text-sm">
          <dt className="w-32 font-semibold text-gray-500 flex-shrink-0">{row.label}</dt>
          <dd className="text-gray-800 flex-1">{row.value}</dd>
        </div>
      ))}

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2 mt-4">
        <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
        Once submitted, you cannot edit the manuscript details. Ensure everything is correct before clicking Submit.
      </div>
    </div>
  )
}

export default function NewSubmissionPage() {
  const navigate = useNavigate()
  const [step,        setStep]        = useState(1)
  const [errors,      setErrors]      = useState({})
  const [submitted,   setSubmitted]   = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [manuscriptId, setManuscriptId] = useState('')
  const [subjectAreas, setSubjectAreas] = useState([])

  useEffect(() => {
    subjectsApi.list()
      .then(data => setSubjectAreas(data || []))
      .catch(() => {})
  }, [])

  const [formData, setFormData] = useState({
    details: { title: '', articleType: '', abstract: '', keywords: '', subjectArea: '' },
    authors: { coAuthors: [] },
    files:   { mainFile: null, coverLetter: null, highlights: null, titlePage: null },
    policy:  { allPoliciesAgreed: false },
  })

  const updateSection = (section) => (key, value) => {
    setFormData(p => ({ ...p, [section]: { ...p[section], [key]: value } }))
  }

  const validateStep = () => {
    if (step === 1) {
      const errs = {}
      if (!formData.details.title.trim())    errs.title       = 'Title is required'
      if (!formData.details.articleType)     errs.articleType = 'Article type is required'
      if (formData.details.abstract.split(/\s+/).filter(Boolean).length < 50)
                                             errs.abstract    = 'Abstract should be at least 50 words'
      if (!formData.details.keywords.trim()) errs.keywords    = 'At least one keyword is required'
      setErrors(errs)
      return Object.keys(errs).length === 0
    }
    return true
  }

  const handleNext = () => {
    if (validateStep()) setStep(s => Math.min(5, s + 1))
  }

  const handleBack = () => { setStep(s => Math.max(1, s - 1)); setErrors({}) }

const handleSubmit = async () => {
  setSubmitError('')
  setLoading(true)
  try {
    const ms = await manuscriptsApi.create({
      title:        formData.details.title,
      article_type: formData.details.articleType,
      abstract:     formData.details.abstract,
      keywords:     formData.details.keywords,
      subject_area: formData.details.subjectArea || null,
      co_authors:   formData.authors.coAuthors
        .filter(a => a.name.trim())
        .map((a, i) => ({
          name:             a.name,
          email:            a.email,
          affiliation:      a.affiliation,
          is_corresponding: a.corresponding,
          author_order:     i + 1,
        })),
      policy_data: formData.policy,
    })

    // Upload all files — skip nulls
    const uploads = [
      { file: formData.files.mainFile,    type: 'main'         },
      { file: formData.files.coverLetter, type: 'cover_letter' },
      { file: formData.files.highlights,  type: 'highlights'   },
      { file: formData.files.titlePage,   type: 'title_page'   },
    ]
    for (const { file, type } of uploads) {
      if (file) await manuscriptsApi.uploadFile(ms.id, file, type)
    }

    await manuscriptsApi.submit(ms.id)
    setManuscriptId(ms.manuscript_id)
    setSubmitted(true)
  } catch (err) {
    setSubmitError(err.message || 'Submission failed. Please try again.')
  } finally {
    setLoading(false)
  }
}
  if (submitted) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={28} className="text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-navy-900 mb-2">Submission Received!</h2>
          <p className="text-gray-500 mb-2">Your manuscript has been submitted successfully.</p>
          <p className="text-sm text-gray-400 mb-6">
            Manuscript ID: <strong className="text-navy-900">{manuscriptId}</strong>
          </p>
          <button onClick={() => navigate('/dashboard/author')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900">New Submission</h1>
        <p className="text-gray-500 mt-1">Please complete all required fields to submit your manuscript for peer review.</p>
      </div>

      <StepIndicator current={step} />

      <div className="card p-6 lg:p-8 mb-6">
        {step === 1 && <Step1 data={formData.details} onChange={updateSection('details')} errors={errors} subjectAreas={subjectAreas} />}
        {step === 2 && <Step2 data={formData.authors} onChange={updateSection('authors')} />}
        {step === 3 && <Step3 data={formData.files}   onChange={updateSection('files')} />}
        {step === 4 && <Step4 data={formData.policy}  onChange={updateSection('policy')} />}
        {step === 5 && <Step5 formData={formData} />}
      </div>

      {submitError && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="shrink-0" /> {submitError}
        </div>
      )}

      <div className="flex items-center justify-between">
        {step > 1 ? (
          <button onClick={handleBack} className="btn-outline">← Previous</button>
        ) : <div />}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/author')} className="btn-outline">Save Draft</button>
          {step < 5 ? (
            <button onClick={handleNext} className="btn-primary">Next Step →</button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="btn-primary bg-green-700 hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
              {loading ? <><Loader size={15} className="animate-spin" /> Submitting…</> : 'Submit Manuscript'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}