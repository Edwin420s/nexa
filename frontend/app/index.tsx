import { ArrowRight, Sparkles, Zap, Shield, Globe } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950/20 border-b border-blue-900/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border-2 border-blue-500/40 mb-6 shadow-glow-blue">
              <Sparkles className="w-4 h-4 mr-2 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Gemini 3 Hackathon Project</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="text-blue-400 text-glow-blue">
                Nexa
              </span>
            </h1>

            <p className="text-2xl md:text-3xl font-semibold mb-8 text-gray-300">
              Autonomous AI Research & Build Platform
            </p>

            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Transform ideas into production-ready code with intelligent agents that research, architect, build, and validate — all powered by Gemini 3.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 inline-flex items-center shadow-glow-blue hover:shadow-glow-blue-lg"
              >
                <span>Launch Platform</span>
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="#demo"
                className="px-8 py-4 border-2 border-gray-700 hover:border-gray-600 rounded-xl font-semibold text-lg transition-colors inline-flex items-center"
              >
                <Zap className="mr-2" size={20} />
                <span>Live Demo</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-gray-900/20 border-y border-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Nexa Wins</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Built specifically for the Gemini 3 Hackathon, Nexa demonstrates advanced agentic workflows, real-time reasoning, and production-grade autonomy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Sparkles className="w-8 h-8 text-blue-400" />,
                title: "Gemini 3 Integration",
                description: "Leverages cutting-edge features like Thought Signatures, Function Calling, and 1M token context for complex reasoning.",
                features: ["Multi-agent orchestration", "Real-time confidence scoring", "Self-correcting workflows"]
              },
              {
                icon: <Zap className="w-8 h-8 text-purple-400" />,
                title: "Autonomous Execution",
                description: "Agents research, plan, build, and validate without human intervention using structured tool calling.",
                features: ["End-to-end automation", "Real-time streaming", "Error recovery"]
              },
              {
                icon: <Shield className="w-8 h-8 text-green-400" />,
                title: "Production Ready",
                description: "Built with scalability, monitoring, and enterprise-grade architecture from day one.",
                features: ["Analytics dashboard", "Project management", "Team collaboration"]
              }
            ].map((feature, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 hover:border-gray-700 transition-colors">
                <div className="mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center text-gray-300">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Preview */}
      <section id="demo" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">See It In Action</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Watch autonomous agents research, plan, and build in real-time
            </p>
          </div>

          <div className="bg-gray-900 border-2 border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-800 bg-gray-900">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 text-sm text-gray-400">
                  Autonomous Agent Workflow Demo
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                    <h4 className="text-lg font-semibold mb-4">Agent Activity</h4>
                    <div className="space-y-4">
                      {[
                        { agent: "Researcher", status: "Analyzing requirements", confidence: 85 },
                        { agent: "Architect", status: "Designing system", confidence: 92 },
                        { agent: "Builder", status: "Generating code", confidence: 78 },
                        { agent: "Reviewer", status: "Validating output", confidence: 88 }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{item.agent}</div>
                            <div className="text-sm text-gray-400">{item.status}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{item.confidence}%</div>
                            <div className="text-xs text-gray-400">Confidence</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h4 className="text-lg font-semibold mb-4">Generated Output</h4>
                  <div className="font-mono text-sm space-y-4">
                    <div className="text-green-400">// Building autonomous research agent...</div>
                    <div className="text-blue-400">import {"{"} GoogleGenAI {"}"} from "@google/genai";</div>
                    <div className="text-gray-300">const ai = new GoogleGenAI({"{"} apiKey: process.env.GEMINI_API_KEY {"}"});</div>
                    <div className="text-purple-400">class ResearchAgent {"{"}</div>
                    <div className="text-gray-300 ml-4">async research(topic: string) {"{"}</div>
                    <div className="text-gray-400 ml-8">// Gemini 3 reasoning...</div>
                    <div className="text-gray-300 ml-4">{"}"}</div>
                    <div className="text-purple-400">{"}"}</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/projects/new"
                  className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 rounded-lg font-medium transition-all transform hover:scale-105 shadow-glow-green"
                >
                  <Sparkles className="mr-2" size={18} />
                  Try It Yourself
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-950/20 border-t border-blue-900/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-500/20 border-2 border-blue-500/40 mb-6 shadow-glow-blue">
            <Globe className="w-4 h-4 mr-2 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Gemini 3 Hackathon Ready</span>
          </div>

          <h2 className="text-3xl font-bold mb-6">Ready to Build the Future?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join thousands of developers using Nexa to create next-generation AI applications with Gemini 3.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 rounded-xl font-semibold text-lg transition-all transform hover:scale-105 shadow-glow-blue hover:shadow-glow-blue-lg"
            >
              Get Started Free
            </Link>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 border-2 border-gray-700 hover:border-gray-600 rounded-xl font-semibold text-lg transition-colors"
            >
              View Source Code
            </a>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            No credit card required • Free tier includes 1000 Gemini API calls
          </p>
        </div>
      </section>
    </div>
  )
}