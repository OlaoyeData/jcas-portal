import React, { createContext, useContext, useState, useEffect } from 'react'
import { announcementsApi } from '../services/api'


const AnnouncementContext = createContext(null)

export const useAnnouncements = () => {
  const ctx = useContext(AnnouncementContext)
  if (!ctx) throw new Error('useAnnouncements must be used within AnnouncementProvider')
  return ctx
}

export function AnnouncementProvider({ children }) {
  const [announcements, setAnnouncements] = useState([])
  const [loading,       setLoading]       = useState(true)

  const fetchActive = () => {
    announcementsApi.getActive()
      .then(data => setAnnouncements(data || []))
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchActive() }, [])

  const refresh = () => fetchActive()

  return (
    <AnnouncementContext.Provider value={{ announcements, loading, refresh }}>
      {children}
    </AnnouncementContext.Provider>
  )
}