'use client'

import { Suspense } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the LoginForm component with no SSR
const LoginForm = dynamic(() => import('@/components/auth/LoginForm'), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-xl border border-gray-800">
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    </div>
  ),
})

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
