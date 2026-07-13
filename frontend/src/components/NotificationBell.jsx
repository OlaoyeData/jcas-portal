import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { notificationsApi } from '../services/api'

const POLL_INTERVAL_MS = 30000

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function NotificationBell() {
  const [open,          setOpen]          = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(false)
  const dropdownRef = useRef(null)
  const navigate     = useNavigate()

  const unreadCount = notifications.filter(n => !n.is_read).length

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.list()
      setNotifications(data)
      setError(false)
    } catch (err) {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleMarkRead = async (id, e) => {
    e.stopPropagation()
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    try {
      await notificationsApi.markRead(id)
    } catch (err) {
      load()
    }
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    try {
      await notificationsApi.markAllRead()
    } catch (err) {
      load()
    }
  }

  const handleClickNotification = (n) => {
    if (!n.is_read) {
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
      notificationsApi.markRead(n.id).catch(() => {})
    }
    setOpen(false)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-gray-500 hover:text-navy-700 transition-colors p-1.5 rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h4 className="text-sm font-bold text-navy-900">Notifications</h4>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="text-xs text-gray-400 text-center py-8">Loading…</p>
            )}
            {!loading && error && (
              <p className="text-xs text-gray-400 text-center py-8">Couldn't load notifications.</p>
            )}
            {!loading && !error && notifications.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-8">You're all caught up.</p>
            )}
            {!loading && !error && notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleClickNotification(n)}
                className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors flex gap-2.5 ${
                  !n.is_read ? 'bg-blue-50/50' : ''
                }`}
              >
                {!n.is_read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
                )}
                <div className={`min-w-0 flex-1 ${n.is_read ? 'pl-4' : ''}`}>
                  <p className={`text-xs leading-snug ${!n.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={(e) => handleMarkRead(n.id, e)}
                    className="text-gray-300 hover:text-blue-600 flex-shrink-0 self-start mt-0.5"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}