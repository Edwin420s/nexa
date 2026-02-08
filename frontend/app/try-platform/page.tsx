'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, Bot, Sparkles, Zap } from 'lucide-react'

export default function TryPlatformPage() {
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    setIsLoading(true)
    setError('')
    setResponse('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
      
      try {
      const res = await fetch(`${apiUrl}/try-platform/try`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'gemini-2.5-flash'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setResponse(data.data.response)
      } else {
        const errorData = await res.json()
        setError(errorData.message || 'Backend error occurred')
      }
    } catch (fetchError) {
      setError('Unable to connect to backend. Please ensure the server is running on port 5000.')
    }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Link href="/" className="inline-block mb-6">
            <h1 className="text-4xl font-bold text-blue-400 text-glow-blue">
              Nexa
            </h1>
          </Link>
          <h2 className="text-3xl font-bold mb-4">Try Platform</h2>
          <p className="text-xl text-gray-300 mb-2">
            Experience the power of AI agents instantly
          </p>
          <p className="text-gray-400">
            Free tier uses lightweight models.{' '}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Create an account
            </Link>{' '}
            for full-featured access.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-blue-400 mb-4">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered</h3>
            <p className="text-gray-400 text-sm">
              Powered by Google's Gemini AI models for intelligent responses
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-green-400 mb-4">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Instant Results</h3>
            <p className="text-gray-400 text-sm">
              Get immediate responses without any registration or setup
            </p>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="text-purple-400 mb-4">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-semibold mb-2">Lightweight</h3>
            <p className="text-gray-400 text-sm">
              Optimized for quick tasks and basic AI interactions
            </p>
          </div>
        </div>

        {/* Main Interface */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-medium mb-2">
                What would you like to accomplish?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                placeholder="Ask me to write code, research a topic, analyze data, or help with a problem..."
                rows={4}
                disabled={isLoading}
              />
              <div className="text-right mt-2">
                <span className="text-sm text-gray-400">
                  {prompt.length}/1000 characters
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Send size={20} className="mr-2" />
                  Generate Response
                </span>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400">
              {error}
            </div>
          )}

          {/* Response */}
          {response && (
            <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-green-400">AI Response</h3>
              <div className="text-gray-200 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        <div className="mt-12 text-center bg-blue-950/20 border border-blue-900/30 rounded-xl p-8">
          <h3 className="text-2xl font-bold mb-4">Want More Power?</h3>
          <p className="text-gray-300 mb-6">
            Create a free account to access advanced features, multiple AI models, 
            project management, and detailed analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green hover:shadow-glow-green-lg rounded-lg font-medium transition-all transform hover:scale-105"
            >
              Create Free Account
            </Link>
            <Link
              href="/#features"
              className="px-6 py-3 border-2 border-gray-700 hover:border-blue-600 rounded-lg font-medium transition-all hover:bg-gray-900/50"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
