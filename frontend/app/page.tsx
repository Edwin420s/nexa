import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/10 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Nexa
          </h1>
          <p className="text-2xl md:text-3xl font-semibold mb-8 text-gray-300">
            Autonomous Research & Build Platform
          </p>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
            Create projects. Run smart agents. Stream results. Score confidence. Track insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/dashboard" 
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
            >
              Launch Platform
            </Link>
            <Link 
              href="#features" 
              className="px-8 py-4 border border-gray-700 hover:border-gray-600 rounded-lg font-semibold text-lg transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Powered by Gemini AI</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-900/50 p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                <div className="text-blue-400 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-8 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 -translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Build with Autonomous AI?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join developers worldwide creating next-generation applications with Gemini-powered agents.
          </p>
          <Link 
            href="/register" 
            className="inline-block px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg font-semibold text-lg transition-all transform hover:scale-105"
          >
            Get Started Free
          </Link>
        </div>
      </section>
    </div>
  )
}

const features = [
  {
    icon: "🤖",
    title: "Autonomous Agents",
    description: "Research, summarize, and build code automatically with Gemini AI agents"
  },
  {
    icon: "⚡",
    title: "Real-time Streaming",
    description: "Watch your projects evolve live with SSE-powered updates"
  },
  {
    icon: "📊",
    title: "Confidence Scoring",
    description: "See how confident your agents are in their outputs with live scoring"
  },
  {
    icon: "📈",
    title: "Analytics Dashboard",
    description: "Track usage, project history, and performance metrics"
  }
]

const steps = [
  {
    title: "Describe Your Goal",
    description: "Tell Nexa what you want to build or research"
  },
  {
    title: "Agents Research & Plan",
    description: "Multiple AI agents work together to create optimal solutions"
  },
  {
    title: "Watch Real-time Progress",
    description: "Stream outputs and confidence scores as agents work"
  }
]