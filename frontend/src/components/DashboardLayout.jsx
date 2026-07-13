import React, { useState } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Users, Star, Settings, PlusCircle, UserCog,
  ChevronLeft, Menu, X, LogOut, BookOpen, Mail, Megaphone, BarChart2, Home
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from './NotificationBell'

const roleNav = {
  author: [
  { to: '/dashboard/author',          label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/dashboard/author/submit',   label: 'My Manuscripts', icon: FileText },
  { to: '/dashboard/author/reviews',  label: 'Peer Review',    icon: Users },
  { to: '/dashboard/author/settings', label: 'Settings',       icon: Settings },
],
reviewer: [
  { to: '/dashboard/reviewer',                  label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/dashboard/reviewer/invitations',      label: 'Invitations',    icon: Users },
  { to: '/dashboard/reviewer/active',           label: 'Active Reviews', icon: FileText },
  { to: '/dashboard/reviewer/history',          label: 'History',        icon: BookOpen },
  { to: '/dashboard/reviewer/settings',         label: 'Settings',       icon: Settings },
],
  editor: [
  { to: '/dashboard/editor',           label: 'My Assignments', icon: LayoutDashboard, end: true },
  { to: '/dashboard/editor/reviewers', label: 'Reviewers',      icon: Users           },
  { to: '/dashboard/editor/settings',  label: 'Settings',       icon: Settings        },
  { to: '/dashboard/editor/my-submissions', label: 'My Manuscripts', icon: FileText   },
  { to: '/dashboard/author/submit',    label: 'Submit Manuscript',icon: PlusCircle    },
],
  admin: [
  { to: '/dashboard/admin',              label: 'Overview',        icon: LayoutDashboard, end: true },
  { to: '/dashboard/admin/users',        label: 'User Management', icon: Users            },
  { to: '/dashboard/admin/journal',      label: 'Journal Settings',icon: Settings         },
  { to: '/dashboard/admin/subjects',     label: 'Subject Areas',   icon: BookOpen         },
  { to: '/dashboard/admin/templates',    label: 'Email Templates', icon: Mail             },
  { to: '/dashboard/admin/announcements',label: 'Announcements',   icon: Megaphone        },
  { to: '/dashboard/admin/volumes', label: 'Volumes & Issues', icon: BookOpen },
  { to: '/dashboard/admin/settings', label: 'My Account',      icon: UserCog },
],
editor_in_chief: [
  { to: '/dashboard/editor_in_chief',              label: 'Dashboard',      icon: LayoutDashboard, end: true },
  { to: '/dashboard/editor_in_chief/queue',        label: 'Submission Queue',icon: FileText        },
  { to: '/dashboard/editor_in_chief/reviewers',    label: 'Reviewers',      icon: Users           },
  { to: '/dashboard/editor_in_chief/metrics',      label: 'Metrics',        icon: BarChart2       },
  { to: '/dashboard/editor_in_chief/settings',     label: 'Settings',       icon: Settings        },
  { to: '/dashboard/editor_in_chief/my-submissions', label: 'My Manuscripts', icon: FileText      },
  { to: '/dashboard/author/submit',                label: 'Submit Manuscript',icon: PlusCircle     },
],
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = roleNav[user?.role] || roleNav.author

  const handleLogout = () => {
    logout()
    navigate('/')
  }


const SidebarContent = () => (
  <div className="flex flex-col h-screen">
    {/* Header */}
    <div className="px-4 py-5 border-b border-gray-100 flex-shrink-0">
      <Link to="/" className="text-xl font-bold text-navy-900 font-display">JCAS</Link>
      <p className="text-xs font-semibold text-gray-500 mt-1">Researcher Hub</p>
      <p className="text-xs text-gray-400">Academic Portal</p>
      <Link to="/"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-navy-700 transition-colors">
        <Home size={12} /> Back to Homepage
      </Link>
    </div>

    {/* Nav — scrollable if items overflow */}
    <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto min-h-0">
      {navItems.map((item) => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.end}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>

    {/* User profile — always pinned to bottom */}
    <div className="px-3 py-4 border-t border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-navy-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
          {user?.initials || user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate capitalize">{user?.role}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="mt-3 w-full flex items-center gap-2 text-xs text-gray-500 hover:text-red-600 transition-colors px-1 py-1 rounded"
      >
        <LogOut size={13} />
        Sign out
      </button>
    </div>
  </div>
)

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 sticky top-0 h-screen overflow-hidden">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-white shadow-xl">
            <button onClick={() => setSidebarOpen(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar — mobile shows menu + logo, both show the notification bell */}
        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 md:hidden">
            <Menu size={20} />
          </button>
          <span className="font-bold text-navy-900 font-display md:hidden">JCAS</span>
          <div className="ml-auto flex items-center gap-3">
            <NotificationBell />
            <Link to="/" className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-navy-700 transition-colors">
              <Home size={16} /> Home
            </Link>
            <Link to="/" className="md:hidden flex items-center gap-1 text-sm text-gray-500">
              <Home size={16} />
            </Link>
          </div>
        </div>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-navy-950 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-500">
            <span>© 2026 Journal of Computing & Applied Sciences</span>
            <div className="flex gap-4">
              {['Ethics Policy', 'Peer Review Process', 'Indexing'].map(l => (
                <Link key={l} to="/about" className="hover:text-gray-300">{l}</Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
