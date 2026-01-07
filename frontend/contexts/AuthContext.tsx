'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authApi } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role?: string
  avatar?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await authApi.getCurrentUser()
        if (data) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password)
    if (response.error) throw new Error(response.error)
    if (!response.data?.user) throw new Error('No user data received')
    setUser(response.data.user)
    router.push('/dashboard')
  }

  const register = async (data: { name: string; email: string; password: string }) => {
    const response = await authApi.register(data)
    if (response.error) throw new Error(response.error)
    if (!response.data?.user) throw new Error('Registration failed')
    setUser(response.data.user)
    router.push('/onboarding')
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    router.push('/login')
  }

  // Redirect to login if not authenticated and not on public route
  useEffect(() => {
    const publicPaths = ['/login', '/register', '/', '/api-docs']
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
    
    if (!loading && !user && !isPublicPath) {
      router.push('/login')
    }
  }, [user, loading, pathname, router])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
