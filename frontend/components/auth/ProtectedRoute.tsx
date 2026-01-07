'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: string
}) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
    }
  }, [loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  // Check role if required
  if (requiredRole && (!user?.role || user.role !== requiredRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-400 mb-6">You don't have permission to view this page.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return <>{children}</>
}
