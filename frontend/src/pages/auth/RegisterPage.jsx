import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [name,        setName]        = useState('')
  const [email,       setEmail]       = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [role,        setRole]        = useState('author')
  const [password,    setPassword]    = useState('')
  const [confirm,     setConfirm]     = useState('')
  const [showPw,      setShowPw]      = useState(false)
  const [errors,      setErrors]      = useState({})
  const [loading,     setLoading]     = useState(false)
  const [pending, setPending] = useState(null)

  const validate = () => {
    const errs = {}
    if (!name.trim())              errs.name        = 'Name is required'
    if (!email.includes('@'))      errs.email       = 'Enter a valid email'
    if (!affiliation.trim())       errs.affiliation = 'Affiliation is required'
    if (password.length < 8)       errs.password    = 'Password must be at least 8 characters'
    if (password !== confirm)      errs.confirm     = 'Passwords do not match'
    return errs
  }

   const validatePassword = (pw) => {
      if (pw.length < 8)                return 'Password must be at least 8 characters.'
      if (!/[a-zA-Z]/.test(pw))        return 'Password must contain at least one letter.'
      if (!/[0-9]/.test(pw))           return 'Password must contain at least one number.'
      return null
    }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    const pwError = validatePassword(password)
    if (pwError) { setErrors(p => ({ ...p, password: pwError })); return }
    const result = await register({ name, email, affiliation, role, password })
    setLoading(false)
    if (result.ok && result.pending) {
      setPending(result.message || 'Please check your email to confirm your account before logging in.')
    } else if (result.ok) {
      navigate(`/dashboard/${result.role}`)
    } else {
      setErrors({ submit: result.error || 'Registration failed. Please try again.' })
    }
   
  }

  if (pending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
          </div>
          <div className="card p-8 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-xl font-bold text-navy-900 mb-2">Account created</h1>
            <p className="text-gray-500 text-sm mb-6">{pending}</p>
            <Link to="/login" className="btn-primary w-full justify-center py-3 text-sm">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center bg-gray-50 px-4 py-6 sm:py-12">
      <div className="w-full max-w-lg">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-navy-700 mb-3 transition-colors">
            ← Back to Homepage
          </Link>
          <div>
            <Link to="/" className="text-2xl font-display font-bold text-navy-900">JCAS</Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900 mt-3 sm:mt-4 mb-1">
            Create an Account
          </h1>
          <p className="text-gray-500 text-sm">Join the JCAS research community</p>
        </div>

        {errors.submit && (
          <div className="mb-4 px-4 py-2.5 rounded-lg text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            {errors.submit}
          </div>
        )}

        <div className="card p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                className={`form-input ${errors.name ? 'border-red-400' : ''}`}
                autoComplete="name"
              />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@institution.edu"
                className={`form-input ${errors.email ? 'border-red-400' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Affiliation */}
            <div>
              <label className="form-label">Affiliation *</label>
              <input
                type="text"
                value={affiliation}
                onChange={e => setAffiliation(e.target.value)}
                placeholder="University / Research Institute"
                className={`form-input ${errors.affiliation ? 'border-red-400' : ''}`}
                autoComplete="organization"
              />
              {errors.affiliation && <p className="text-xs text-red-600 mt-1">{errors.affiliation}</p>}
            </div>

            {/* Role */}
            <div>
              <label className="form-label">Role *</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="form-input"
              >
                <option value="author">Author — I want to submit manuscripts</option>
                <option value="reviewer">Reviewer — I want to review manuscripts</option>
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="form-label">Password *</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className={`form-input pr-10 ${errors.password ? 'border-red-400' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>
            <div className="mt-1.5 space-y-1">
              {[
                { rule: password.length >= 8,           label: 'At least 8 characters' },
                { rule: /[a-zA-Z]/.test(password),      label: 'Contains a letter'     },
                { rule: /[0-9]/.test(password),         label: 'Contains a number'     },
              ].map(({ rule, label }) => (
                <p key={label} className={`text-xs flex items-center gap-1.5 ${
                  rule ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white text-[9px] flex-shrink-0 ${
                    rule ? 'bg-green-500' : 'bg-gray-300'
                  }`}>✓</span>
                  {label}
                </p>
              ))}
            </div>
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}

            {/* Confirm Password */}
            <div>
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat password"
                className={`form-input ${errors.confirm ? 'border-red-400' : ''}`}
                autoComplete="new-password"
              />
              {errors.confirm && <p className="text-xs text-red-600 mt-1">{errors.confirm}</p>}
            </div>

            {/* Terms */}
            <div className="pt-2">
              <label className="flex items-start gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  className="mt-0.5 rounded border-gray-300 text-navy-700 flex-shrink-0"
                />
                <span>
                  I agree to the{' '}
                  <Link to="/about" className="text-blue-600 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/about" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3 text-sm disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>

      </div>
    </div>
  )
}

export default RegisterPage