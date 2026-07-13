import React from 'react'

const configs = {
  published:   { cls: 'bg-green-100 text-green-800',    label: 'PUBLISHED' },
  review:      { cls: 'bg-gray-100 text-gray-700',      label: 'UNDER REVIEW' },
  revision:    { cls: 'bg-red-100 text-red-700',        label: 'REVISIONS REQUIRED' },
  editor:      { cls: 'bg-purple-100 text-purple-700',  label: 'EDITOR ASSIGNED' },
  decision:    { cls: 'bg-green-100 text-green-800',    label: 'DECISION READY' },
  priority:    { cls: 'bg-orange-100 text-orange-800',  label: 'HIGH PRIORITY' },
  in_review:   { cls: 'bg-blue-100 text-blue-800',      label: 'IN REVIEW' },
  submitted:   { cls: 'bg-blue-50 text-blue-700',       label: 'SUBMITTED' },
  pending:     { cls: 'bg-yellow-100 text-yellow-800',  label: 'PENDING' },
  accepted:    { cls: 'bg-green-100 text-green-800',    label: 'ACCEPTED' },
  rejected:    { cls: 'bg-red-100 text-red-700',        label: 'REJECTED' },
  open:        { cls: 'bg-navy-900 text-white',         label: 'OPEN ACCESS' },
  subscription:{ cls: 'bg-gray-100 text-gray-600 border border-gray-300', label: 'SUBSCRIPTION' },
  overdue:     { cls: 'bg-red-100 text-red-700',        label: 'OVERDUE' },
}

export default function StatusBadge({ status, label, className = '' }) {
  const cfg = configs[status] || { cls: 'bg-gray-100 text-gray-600', label: status?.toUpperCase() }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${cfg.cls} ${className}`}>
      {label || cfg.label}
    </span>
  )
}
