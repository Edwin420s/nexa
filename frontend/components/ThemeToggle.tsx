'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme || 'system'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (selectedTheme: Theme) => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (selectedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(selectedTheme)
    }
    
    localStorage.setItem('theme', selectedTheme)
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    applyTheme(newTheme)
  }

  if (!mounted) return null

  return (
    <div className="flex items-center space-x-1 bg-gray-900 border border-gray-800 rounded-lg p-1">
      <button
        onClick={() => handleThemeChange('light')}
        className={`p-2 rounded transition-colors ${theme === 'light' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
        title="Light theme"
      >
        <Sun size={16} className={theme === 'light' ? 'text-yellow-400' : 'text-gray-400'} />
      </button>
      
      <button
        onClick={() => handleThemeChange('dark')}
        className={`p-2 rounded transition-colors ${theme === 'dark' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
        title="Dark theme"
      >
        <Moon size={16} className={theme === 'dark' ? 'text-blue-400' : 'text-gray-400'} />
      </button>
      
      <button
        onClick={() => handleThemeChange('system')}
        className={`p-2 rounded transition-colors ${theme === 'system' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
        title="System theme"
      >
        <Monitor size={16} className={theme === 'system' ? 'text-green-400' : 'text-gray-400'} />
      </button>
    </div>
  )
}