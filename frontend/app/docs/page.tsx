'use client'

import { useState } from 'react'
import { Search, Book, Code, Zap, Users, HelpCircle, ChevronRight, ExternalLink, FileText, Video, MessageSquare } from 'lucide-react'

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('getting-started')

  const categories = [
    {
      id: 'getting-started',
      name: 'Getting Started',
      icon: Zap,
      items: [
        { title: 'Introduction to Nexa', slug: 'introduction' },
        { title: 'Quick Start Guide', slug: 'quick-start' },
        { title: 'Creating Your First Project', slug: 'first-project' },
        { title: 'Understanding Agents', slug: 'understanding-agents' }
      ]
    },
    {
      id: 'agents',
      name: 'Agents',
      icon: Users,
      items: [
        { title: 'Researcher Agent', slug: 'researcher-agent' },
        { title: 'Builder Agent', slug: 'builder-agent' },
        { title: 'Architect Agent', slug: 'architect-agent' },
        { title: 'Custom Agents', slug: 'custom-agents' },
        { title: 'Agent Configuration', slug: 'agent-config' }
      ]
    },
    {
      id: 'api',
      name: 'API Reference',
      icon: Code,
      items: [
        { title: 'REST API Overview', slug: 'api-overview' },
        { title: 'Authentication', slug: 'authentication' },
        { title: 'Projects API', slug: 'projects-api' },
        { title: 'Agents API', slug: 'agents-api' },
        { title: 'Webhooks & SSE', slug: 'webhooks' }
      ]
    },
    {
      id: 'gemini',
      name: 'Gemini Integration',
      icon: Book,
      items: [
        { title: 'Gemini 3 Features', slug: 'gemini-features' },
        { title: 'Model Selection', slug: 'model-selection' },
        { title: 'Function Calling', slug: 'function-calling' },
        { title: 'Cost Optimization', slug: 'cost-optimization' }
      ]
    },
    {
      id: 'tutorials',
      name: 'Tutorials',
      icon: Video,
      items: [
        { title: 'Build a Research Agent', slug: 'tutorial-research' },
        { title: 'Create Code Generator', slug: 'tutorial-codegen' },
        { title: 'Multi-Agent Systems', slug: 'tutorial-multi-agent' },
        { title: 'Production Deployment', slug: 'tutorial-deployment' }
      ]
    }
  ]

  const popularArticles = [
    { title: 'How to Build Autonomous Agents', views: '2.4k', category: 'agents' },
    { title: 'Gemini 3 Integration Guide', views: '1.8k', category: 'gemini' },
    { title: 'Cost Management Best Practices', views: '1.5k', category: 'gemini' },
    { title: 'Real-time Streaming Setup', views: '1.2k', category: 'api' },
    { title: 'Team Collaboration Features', views: '980', category: 'getting-started' }
  ]

  const activeCategoryData = categories.find(c => c.id === activeCategory)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Book className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Documentation</h1>
              <p className="text-gray-400">Learn how to build with Nexa and Gemini 3</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documentation..."
              className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <nav className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <div key={category.id}>
                      <button
                        onClick={() => setActiveCategory(category.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${activeCategory === category.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={18} className={activeCategory === category.id ? 'text-blue-400' : 'text-gray-400'} />
                          <span className={activeCategory === category.id ? 'font-medium' : 'text-gray-300'}>
                            {category.name}
                          </span>
                        </div>
                        <ChevronRight size={16} className={activeCategory === category.id ? 'text-blue-400' : 'text-gray-500'} />
                      </button>
                      
                      {activeCategory === category.id && (
                        <div className="ml-10 mt-2 space-y-1">
                          {category.items.map((item) => (
                            <a
                              key={item.slug}
                              href={`#${item.slug}`}
                              className="block px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-gray-800/30 transition-colors"
                            >
                              {item.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </nav>

              {/* Help Section */}
              <div className="mt-8 p-4 bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-xl">
                <div className="flex items-center space-x-3 mb-3">
                  <HelpCircle className="text-blue-400" size={20} />
                  <h3 className="font-medium">Need Help?</h3>
                </div>
                <div className="space-y-3">
                  <a href="#" className="flex items-center text-sm text-gray-300 hover:text-white">
                    <MessageSquare size={14} className="mr-2" />
                    Join Community Discord
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-300 hover:text-white">
                    <FileText size={14} className="mr-2" />
                    View API Reference
                  </a>
                  <a href="#" className="flex items-center text-sm text-gray-300 hover:text-white">
                    <ExternalLink size={14} className="mr-2" />
                    Gemini 3 Documentation
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Popular Articles */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Popular Articles</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularArticles.map((article, index) => (
                  <a
                    key={index}
                    href="#"
                    className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl hover:border-gray-700 transition-colors group"
                  >
                    <div className="text-sm text-gray-400 mb-2">{article.category}</div>
                    <h3 className="font-medium mb-2 group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>
                    <div className="text-sm text-gray-500">{article.views} views</div>
                  </a>
                ))}
              </div>
            </div>

            {/* Active Category Content */}
            {activeCategoryData && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <activeCategoryData.icon className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{activeCategoryData.name}</h2>
                    <p className="text-gray-400">
                      Learn about {activeCategoryData.name.toLowerCase()} features and best practices
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {activeCategoryData.items.map((item, index) => (
                    <div key={item.slug} id={item.slug} className="scroll-mt-8">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                          <div className="text-sm text-gray-400">
                            Updated {['Yesterday', '2 days ago', '1 week ago'][index % 3]}
                          </div>
                        </div>
                        <a
                          href="#"
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <span>Share</span>
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      
                      <div className="prose prose-invert max-w-none">
                        {index === 0 && activeCategory === 'getting-started' && (
                          <>
                            <p className="text-gray-300 mb-4">
                              Nexa is an autonomous AI research and build platform powered by Google's Gemini 3. 
                              It enables developers to create intelligent agents that can research, plan, code, 
                              and validate projects autonomously.
                            </p>
                            <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg mb-4">
                              <h4 className="font-medium mb-2">✨ Key Features</h4>
                              <ul className="space-y-2 text-gray-300">
                                <li>• Multi-agent orchestration with specialized roles</li>
                                <li>• Real-time streaming of agent outputs</li>
                                <li>• Confidence scoring and self-reflection</li>
                                <li>• Gemini 3 integration with 1M token context</li>
                                <li>• Production-ready architecture</li>
                              </ul>
                            </div>
                          </>
                        )}
                        
                        {index === 0 && activeCategory === 'agents' && (
                          <>
                            <p className="text-gray-300 mb-4">
                              Agents are the core building blocks of Nexa. Each agent specializes in different 
                              tasks and works collaboratively to achieve complex goals.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mb-4">
                              {[
                                { name: 'Researcher', description: 'Gathers and analyzes information', color: 'blue' },
                                { name: 'Architect', description: 'Designs system architecture', color: 'purple' },
                                { name: 'Builder', description: 'Generates code and components', color: 'green' },
                                { name: 'Reviewer', description: 'Validates and tests outputs', color: 'yellow' }
                              ].map((agent) => (
                                <div key={agent.name} className="p-4 bg-gray-800/30 border border-gray-700 rounded-lg">
                                  <div className={`text-${agent.color}-400 font-medium mb-1`}>{agent.name}</div>
                                  <div className="text-sm text-gray-400">{agent.description}</div>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        
                        {index === 0 && activeCategory === 'gemini' && (
                          <>
                            <p className="text-gray-300 mb-4">
                              Nexa leverages Google's Gemini 3 models to power intelligent agent behavior. 
                              Learn how to optimize your usage and leverage advanced features.
                            </p>
                            <div className="p-4 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg mb-4">
                              <h4 className="font-medium mb-2">🚀 Gemini 3 Features Used</h4>
                              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>1M token context window</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Function calling</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Structured outputs</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                                  <span>Multi-modal reasoning</span>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        <p className="text-gray-300">
                          This article will guide you through all aspects of {item.title.toLowerCase()}. 
                          You'll learn best practices, configuration options, and real-world examples.
                        </p>
                        
                        <div className="mt-4">
                          <a
                            href="#"
                            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                          >
                            <span>Read full article</span>
                            <ChevronRight size={16} />
                          </a>
                        </div>
                      </div>
                      
                      {index < activeCategoryData.items.length - 1 && (
                        <div className="my-6 border-t border-gray-800" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Start Card */}
            <div className="mt-8">
              <div className="bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-pink-900/20 border border-gray-800 rounded-xl p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-4">Ready to Start Building?</h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Follow our step-by-step tutorial to create your first autonomous agent in minutes.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                      href="/projects/new"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      Start Tutorial
                    </a>
                    <a
                      href="#"
                      className="px-6 py-3 border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-colors"
                    >
                      Watch Demo Video
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}