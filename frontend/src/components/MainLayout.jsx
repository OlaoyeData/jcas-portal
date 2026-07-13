import React, { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/archive', label: 'Archive' },
  { to: '/about', label: 'About' },
  { to: '/apc', label: 'APC' },
  { to: '/submit/guidelines', label: 'Submit' },
]

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <span className="text-2xl font-bold text-navy-900 tracking-tight font-display">JCAS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    isActive ? 'text-navy-900 border-b-2 border-navy-900' : 'text-gray-600 hover:text-gray-900'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center">
                <input
                  autoFocus
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search articles..."
                  className="border border-gray-300 rounded-l-md px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-1 focus:ring-navy-600"
                />
                <button type="submit" className="bg-navy-900 text-white px-3 py-1.5 rounded-r-md text-sm hover:bg-navy-800">Go</button>
                <button type="button" onClick={() => setSearchOpen(false)} className="ml-2 text-gray-400 hover:text-gray-600">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-gray-500 hover:text-gray-800 p-1.5 rounded-md hover:bg-gray-100 transition-colors">
                <Search size={18} />
              </button>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to={`/dashboard/${user.role}`} className="hidden sm:flex items-center gap-2 text-sm font-medium text-navy-900 hover:underline">
                  <span className="w-8 h-8 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
                    {user.initials}
                  </span>
                </Link>
                <button onClick={() => { logout(); navigate('/') }} className="hidden sm:block text-sm text-gray-500 hover:text-gray-800">
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block btn-primary text-sm py-1.5 px-4">
                Login
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-1.5 text-gray-500 hover:text-gray-800">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
          {navLinks.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 text-sm font-medium rounded-md ${isActive ? 'bg-navy-50 text-navy-900' : 'text-gray-600'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <Link to={`/dashboard/${user.role}`} onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-navy-900">Dashboard</Link>
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false) }} className="block px-3 py-2 text-sm text-gray-500 w-full text-left">Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-medium text-navy-900">Login</Link>
          )}
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="bg-navy-950 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">
              © 2026 Journal of Computing & Applied Sciences. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              { label: 'Ethics Policy',        to: '/about'         },
              { label: 'Peer Review Process',  to: '/peer-review'   },
              { label: 'Indexing',             to: '/indexing'      },
              { label: 'Open Access Statement',to: '/open-access'   },
              { label: 'Article Processing Charge', to: '/apc'      },
              { label: 'Contact',              to: '/about'         },
            ].map(link => (
              <Link key={link.label} to={link.to} className="hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
