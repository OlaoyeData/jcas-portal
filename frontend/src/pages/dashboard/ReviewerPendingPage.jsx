import React from 'react'
import { Clock, Mail, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function ReviewerPendingPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock size={30} className="text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-3">Account Pending Approval</h1>
        <p className="text-gray-500 leading-relaxed mb-4">
          Thank you for registering as a reviewer, <strong>{user?.name}</strong>.
          Your account is currently under review by the Editor-in-Chief.
        </p>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          You will receive an email at <strong>{user?.email}</strong> once your account
          has been approved. This usually takes 1–3 business days.
        </p>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 flex items-start gap-3 mb-6 text-left">
          <Mail size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            If you believe this is taking too long, please contact the editorial office at{' '}
            <a href="mailto:jcaseditor@aaua.edu.ng" className="underline font-medium">
              jcaseditor@aaua.edu.ng
            </a>
          </p>
        </div>
        <button onClick={logout}
          className="btn-outline text-sm flex items-center gap-2 mx-auto">
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </div>
  )
}