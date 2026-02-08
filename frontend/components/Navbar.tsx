'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, LogIn, Settings, UserPlus, User, LogOut } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900/95 backdrop-blur-md border-b border-gray-800 py-2' : 'bg-gray-900/80 backdrop-blur-sm py-3'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-blue-400 text-glow-blue">
              Nexa
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <div className="hidden md:flex items-center space-x-4">
                  <ThemeToggle />
                  {isAuthenticated ? (
                    <>
                      <Link href="/dashboard" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Dashboard
                      </Link>
                      <Link href="/projects" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Projects
                      </Link>
                      <Link href="/analytics" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Analytics
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/try-platform" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Try Platform
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User size={16} className="text-white" />
                    </div>
                    <span className="text-gray-300 text-sm">{user?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                    Sign In
                  </Link>
                  <Link href="/register" className="bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg text-white px-4 py-2 rounded-md text-sm font-medium">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden flex items-center">
            <div className="mr-4">
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-gray-900/95 backdrop-blur-lg`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {isAuthenticated ? (
            <>
              <Link 
                href="/dashboard" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/dashboard' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                href="/projects" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname.startsWith('/projects') ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                Projects
              </Link>
              <Link 
                href="/analytics" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/analytics' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                Analytics
              </Link>
              <Link 
                href="/settings" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                <div className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </div>
              </Link>
              <div className="border-t border-gray-800 pt-2 mt-2">
                <div className="flex items-center px-3 py-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <User size={16} className="text-white" />
                  </div>
                  <span className="text-gray-300">{user?.name}</span>
                </div>
                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                >
                  <div className="flex items-center">
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </div>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/try-platform" 
                className={`block px-3 py-2 rounded-md text-base font-medium ${pathname === '/try-platform' ? 'bg-gray-800 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}`}
                onClick={() => setIsOpen(false)}
              >
                Try Platform
              </Link>
              <div className="border-t border-gray-800 pt-2 mt-2">
                <Link 
                  href="/login" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:bg-gray-800 hover:text-white"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <LogIn className="mr-2 h-5 w-5" />
                    Sign In
                  </div>
                </Link>
                <Link 
                  href="/register" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Get Started
                  </div>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}