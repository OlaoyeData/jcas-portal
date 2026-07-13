import React, { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import {
  ChevronLeft, Upload, CheckCircle, Clock, AlertCircle,
  X, FileText, Loader, CreditCard, Info
} from 'lucide-react'
import { paymentsApi, manuscriptsApi } from '../../services/api'

const STATUS = {
  pending:   { label: 'Payment Required',      cls: 'bg-amber-100 text-amber-700',  icon: AlertCircle },
  submitted: { label: 'Awaiting Confirmation', cls: 'bg-blue-100 text-blue-700',    icon: Clock       },
  confirmed: { label: 'Payment Confirmed',     cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
  waived:    { label: 'Fee Waived',            cls: 'bg-gray-100 text-gray-600',    icon: CheckCircle },
}

const BANK_DETAILS = [
  ['Account Name',   'JCAS'],
  ['Account Number', '1140280986'],
  ['Bank Name',      'Polaris Bank'],
]

const TYPE_COPY = {
  assessment:  { title: 'Manuscript Assessment Fee',  desc: 'Payable on submission. Covers editorial screening and peer review.' },
  publication: { title: 'Publication Fee',             desc: 'Payable after acceptance. Covers journal handling, DOI, and open-access publication.' },
}

export default function PaymentPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const paymentType = searchParams.get('type') === 'assessment' ? 'assessment' : 'publication'

  const [manuscript, setManuscript] = useState(null)
  const [payment,    setPayment]    = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [file,       setFile]       = useState(null)
  const [uploading,  setUploading]  = useState(false)
  const [error,      setError]      = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      manuscriptsApi.get(id),
      paymentsApi.get(id, paymentType).catch(() => null),
    ]).then(([ms, pay]) => {
      setManuscript(ms)
      setPayment(pay)
    }).finally(() => setLoading(false))
  }, [id, paymentType])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      await paymentsApi.uploadProof(id, file, paymentType)
      const updated = await paymentsApi.get(id, paymentType)
      setPayment(updated)
      setFile(null)
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Loading…</div>
  if (!payment) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">No payment record found for this manuscript.</p>
      <Link to="/dashboard/author" className="text-blue-600 text-sm mt-2 inline-block">← Back to Dashboard</Link>
    </div>
  )

  const sc = STATUS[payment.status] || STATUS.pending
  const Icon = sc.icon
  const copy = TYPE_COPY[paymentType]

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl">
      <Link to={`/dashboard/author/manuscript/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-700 mb-6">
        <ChevronLeft size={15} /> Back to Manuscript
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">{copy.title}</h1>
        <p className="text-gray-500 mt-1 text-sm">{copy.desc}</p>
        {manuscript && (
          <p className="text-gray-400 mt-1 text-xs line-clamp-2">{manuscript.manuscript_id} — {manuscript.title}</p>
        )}
      </div>

      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold mb-6 ${sc.cls}`}>
        <Icon size={14} /> {sc.label}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
            <CreditCard size={15} className="text-navy-600" /> Payment Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Amount Due</p>
              <p className="text-2xl font-bold text-navy-900">
                {payment.currency === 'NGN' ? '₦' : payment.currency + ' '}
                {Number(payment.amount).toLocaleString()}
              </p>
            </div>
            <div className="pt-3 border-t border-gray-100 space-y-2">
              {BANK_DETAILS.map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="font-semibold text-gray-800">{v}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 mt-2">
              <Info size={12} className="mt-0.5 flex-shrink-0" />
              After paying, also forward a copy of your payment details to sraeditor@aaua.edu.ng, in addition to uploading proof here.
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-bold text-navy-900 mb-1 flex items-center gap-2">
            <Upload size={15} className="text-navy-600" /> Upload Payment Proof
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            After making the transfer, upload a screenshot or receipt of the transaction.
          </p>

          {payment.status === 'confirmed' ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">Payment Verified</p>
                <p className="text-xs text-green-600">
                  Confirmed on {new Date(payment.confirmed_at).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          ) : payment.status === 'submitted' ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Clock size={18} className="text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800">Receipt Received — Awaiting Confirmation</p>
                <p className="text-xs text-blue-600">
                  The editorial office will verify your payment and confirm shortly.
                  You will receive a notification once confirmed.
                </p>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                  <AlertCircle size={12} className="flex-shrink-0" /> {error}
                </div>
              )}
              {file ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                  <FileText size={16} className="text-navy-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-navy-400 cursor-pointer transition-colors mb-3">
                  <Upload size={22} className="text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600">Click to upload receipt</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG — up to 10 MB</p>
                  <input type="file" accept=".png,.jpg,.jpeg" className="sr-only"
                    onChange={e => setFile(e.target.files[0])} />
                </label>
              )}
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading
                  ? <><Loader size={13} className="animate-spin" /> Uploading…</>
                  : <><CheckCircle size={13} /> Submit Payment Proof</>
                }
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 card p-4 bg-blue-50 border-blue-100">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Questions about payment? Contact the editorial office at{' '}
            <a href="mailto:jcaseditor@aaua.edu.ng" className="font-semibold underline">jcaseditor@aaua.edu.ng</a>{' '}
            or WhatsApp +234 703 134 1911. Include your manuscript ID in your message.
          </p>
        </div>
      </div>
    </div>
  )
}