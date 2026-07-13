const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { ...options.headers }
  if (!options.isFormData) headers['Content-Type'] = 'application/json'
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Only redirect on 401 for authenticated requests, not the login endpoint
  if (res.status === 401 && !path.includes('/auth/login')) {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    window.location.href = '/login'
    return
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    const detail = err.detail
    const message = Array.isArray(detail)
      ? detail.map(e => e.msg || e.message || JSON.stringify(e)).join('; ')
      : (typeof detail === 'string' ? detail : 'Request failed')
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const authApi = {
  login:            (email, password) => request('/auth/login',    { method: 'POST', body: JSON.stringify({ email, password }) }),
  register:         (data)            => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me:               ()                => request('/auth/me'),
  resetRequest:     (email)           => request('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email }) }),
  resetConfirm:     (token, new_password) => request('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
  getInvitation:    (token) => request(`/auth/invitation/${token}`),
  acceptInvitation: (data)  => request('/auth/accept-invitation', { method: 'POST', body: JSON.stringify(data) }),
  verifyEmail:      (token) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  resendVerify:     (email) => request('/auth/verify-email/resend', { method: 'POST', body: JSON.stringify({ email }) }),
}

export const manuscriptsApi = {
  listMine: (status) =>
    request(`/manuscripts/my${status ? `?status=${status}` : ''}`),
  listAll:  (status) =>
    request(`/manuscripts/${status ? `?status=${status}` : ''}`),
  get:      (id) => request(`/manuscripts/${id}`),
  create:   (data) =>
    request('/manuscripts/', { method: 'POST', body: JSON.stringify(data) }),
  update:   (id, data) =>
    request(`/manuscripts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  submit:   (id) =>
    request(`/manuscripts/${id}/submit`, { method: 'POST' }),
  resubmit: (id) =>
    request(`/manuscripts/${id}/resubmit`, { method: 'POST' }),
  withdraw: (id) =>
    request(`/manuscripts/${id}`, { method: 'DELETE' }),
  assignEditor: (id, editor_id) =>
    request(`/manuscripts/${id}/assign-editor`, { method: 'POST', body: JSON.stringify({ editor_id }) }),
  sendToReview: (id) =>
    request(`/manuscripts/${id}/send-to-review`, { method: 'POST' }),
  screenManuscript: (id, decision, reason) =>
    request(`/manuscripts/${id}/screen`, {
      method: 'POST', body: JSON.stringify({ decision, reason }),
    }),
  publishManuscript: (id, doi = null, issueId = null) =>
    request(`/manuscripts/${id}/publish`, {
      method: 'POST',
      body: JSON.stringify({ doi, issue_id: issueId }),
    }),
  decision: (id, decision, note) =>
    request(`/manuscripts/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, note }) }),
  sendRevisionReminder: (id, deadline) =>
    request(`/manuscripts/${id}/revision-reminder`, { method: 'POST', body: JSON.stringify({ deadline }) }),
  getAuthorReviews: (id) =>
    request(`/reviews/manuscript/${id}/author-reviews`),
  uploadFile: async (id, file, fileType = 'main') => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(
      `${BASE}/manuscripts/${id}/files?file_type=${fileType}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
    )
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  },
  downloadFile: async (manuscriptId, fileId, filename) => {
    const token = getToken()
    const res = await fetch(`${BASE}/manuscripts/${manuscriptId}/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}

export const reviewsApi = {
  myInvitations: () => request('/reviews/my-invitations'),
  myActive:      () => request('/reviews/my-active'),
  myHistory:     () => request('/reviews/my-history'),
  respond:       (assignmentId, accept, decline_reason) =>
    request(`/reviews/assignments/${assignmentId}/respond`, {
      method: 'POST', body: JSON.stringify({ accept, decline_reason })
    }),
  getReview:     (assignmentId) =>
    request(`/reviews/assignments/${assignmentId}/review`),
  saveReview:    (assignmentId, data) =>
    request(`/reviews/assignments/${assignmentId}/review`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  inviteReviewer: (manuscriptId, reviewer_id, deadline) =>
    request(`/reviews/assignments?manuscript_id=${manuscriptId}`, {
      method: 'POST', body: JSON.stringify({ reviewer_id, deadline })
    }),
  getManuscriptReviews: (manuscriptId) =>
    request(`/reviews/manuscript/${manuscriptId}/reviews`),
  uploadReviewFile:  (assignmentId, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request(`/reviews/assignments/${assignmentId}/files`, { method: 'POST', body: fd, isFormData: true })
  },
  deleteReviewFile: (assignmentId, fileId) =>
    request(`/reviews/assignments/${assignmentId}/files/${fileId}`, { method: 'DELETE' }),
  shareReviewFile: (fileId) =>
    request(`/reviews/files/${fileId}/share-with-author`, { method: 'POST' }),
  overdue:       () => request('/reviews/overdue'),
  notifyOverdue: () => request('/reviews/overdue/notify', { method: 'POST' }),
  downloadReviewFile: async (fileId, filename) => {
    const token = getToken()
    const res = await fetch(`${BASE}/reviews/files/${fileId}/download`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
  }

export const archiveApi = {
  volumes:  () => request('/volumes'),
  articles: (volume, issue, params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/volumes/${volume}/issues/${issue}/articles${q ? `?${q}` : ''}`)
  },
  getArticle:     (id)  => request(`/articles/${id}`),
  search:         (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request(`/search?${q}`)
  },
  recordDownload: (id)  =>
    request(`/articles/${id}/download`, { method: 'POST' }),
  publish: (manuscriptId, data) =>
    request(`/manuscripts/${manuscriptId}/publish`, {
      method: 'POST', body: JSON.stringify(data)
    }),
  createVolume: (data) =>
    request('/volumes', { method: 'POST', body: JSON.stringify(data) }),
  createIssue:  (data) =>
    request('/issues',  { method: 'POST', body: JSON.stringify(data) }),
  publicStats: () =>
    request('/public-stats'),
}

export const notificationsApi = {
  list:        (unreadOnly = false) =>
    request(`/notifications${unreadOnly ? '?unread_only=true' : ''}`),
  markRead:    (id) =>
    request(`/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    request('/notifications/read-all', { method: 'POST' }),
}

export const usersApi = {
  me:         () => request('/users/me'),
  updateMe:   (data) =>
    request('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),
  reviewers:  (search) =>
    request(`/users/reviewers${search ? `?search=${search}` : ''}`),
  editors: () =>
    request('/users/editors'),
  pendingReviewers: () =>
    request('/users/pending-reviewers'),
  approveReviewer: (id) =>
    request(`/users/${id}/approve-reviewer`, { method: 'POST' }),
  rejectReviewer: (id) =>
    request(`/users/${id}/reject-reviewer`, { method: 'POST' }),
  listAll:    (role) =>
    request(`/users/${role ? `?role=${role}` : ''}`),
  updateUser: (id, data) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (current_password, new_password) =>
  request('/users/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, new_password }),
  }),
}

export const paymentsApi = {
  get: (manuscriptId, paymentType = 'publication') =>
    request(`/payments/manuscript/${manuscriptId}?payment_type=${paymentType}`),
  uploadProof: (manuscriptId, file, paymentType = 'publication') => {
    const fd = new FormData()
    fd.append('file', file)
    return request(`/payments/manuscript/${manuscriptId}/upload-proof?payment_type=${paymentType}`, {
      method: 'POST', body: fd, isFormData: true,
    })
  },
  confirm: (manuscriptId, paymentType = 'publication') =>
    request(`/payments/manuscript/${manuscriptId}/confirm?payment_type=${paymentType}`, { method: 'POST' }),
  listPending: () => request('/payments/pending'),
  listConfirmed: (paymentType = 'publication') =>
    request(`/payments/confirmed?payment_type=${paymentType}`),
  my: () => request('/payments/my'),
  downloadProofUrl: (manuscriptId, paymentType = 'publication') =>
    `/payments/manuscript/${manuscriptId}/proof?payment_type=${paymentType}`,
}

export const adminApi = {
  overview:        () => request('/admin/stats/overview'),
  byMonth:         () => request('/admin/stats/submissions-by-month'),
  turnaround:      () => request('/admin/stats/review-turnaround'),
  auditLog:        () => request('/admin/audit-log'),
  // Editor invitations
  inviteEditor:    (data)    => request('/admin/invite-editor',          { method: 'POST',   body: JSON.stringify(data) }),
  listInvitations: ()        => request('/admin/invitations'),
  revokeInvitation:(id)      => request(`/admin/invitations/${id}`,      { method: 'DELETE' }),
  // Reviewer vetting
  pendingReviewers:()        => request('/admin/reviewers/pending'),
  approveReviewer: (id)      => request(`/admin/reviewers/${id}/approve`,{ method: 'POST'   }),
  rejectReviewer:  (id)      => request(`/admin/reviewers/${id}/reject`, { method: 'POST'   }),
}

export const announcementsApi = {
  getActive: ()         => request('/announcements'),
  getAll:    ()         => request('/announcements/all'),
  create:    (data)     => request('/announcements',     { method: 'POST',  body: JSON.stringify(data) }),
  update:    (id, data) => request(`/announcements/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete:    (id)       => request(`/announcements/${id}`, { method: 'DELETE' }),
}

export const emailTemplatesApi = {
  list:   ()          => request('/email-templates'),
  update: (key, data) => request(`/email-templates/${key}`,        { method: 'PATCH', body: JSON.stringify(data) }),
  reset:  (key)       => request(`/email-templates/${key}/reset`,  { method: 'POST'  }),
}

export const journalApi = {
  get:    ()       => request('/journal-settings'),
  update: (data)   => request('/journal-settings', { method: 'PATCH', body: JSON.stringify(data) }),
}

export const subjectsApi = {
  list:   (activeOnly = true) => request(`/subject-areas?active_only=${activeOnly}`),
  create: (data)              => request('/subject-areas',       { method: 'POST',   body: JSON.stringify(data) }),
  update: (id, data)          => request(`/subject-areas/${id}`, { method: 'PATCH',  body: JSON.stringify(data) }),
  delete: (id)                => request(`/subject-areas/${id}`, { method: 'DELETE' }),
}