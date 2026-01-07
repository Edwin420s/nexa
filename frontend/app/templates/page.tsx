'use client'

import { useState } from 'react'
import { Template, Zap, Cpu, Database, Code, Globe, Lock, Rocket, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'

interface ProjectTemplate {
  id: string
  name: string
  description: string
  category: string
  complexity: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime: string
  agents: number
  confidence: number
  tags: string[]
  useCases: string[]
  features: string[]
}

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedComplexity, setSelectedComplexity] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const templates: ProjectTemplate[] = [
    {
      id: 'autonomous-research',
      name: 'Autonomous Research Agent',
      description: 'Multi-agent system for automated research and documentation generation',
      category: 'research',
      complexity: 'intermediate',
      estimatedTime: '2-4 hours',
      agents: 4,
      confidence: 0.92,
      tags: ['Gemini 3 Pro', 'Multi-agent', 'Real-time'],
      useCases: ['Market research', 'Academic papers', 'Competitive analysis'],
      features: ['Web scraping', 'Document summarization', 'Citation generation']
    },
    {
      id: 'code-generation',
      name: 'Smart Code Generator',
      description: 'AI-powered code generation with testing and optimization',
      category: 'development',
      complexity: 'advanced',
      estimatedTime: '3-5 hours',
      agents: 5,
      confidence: 0.88,
      tags: ['Gemini Code', 'Testing', 'Optimization'],
      useCases: ['Prototype development', 'API creation', 'Library generation'],
      features: ['Test generation', 'Code review', 'Performance optimization']
    },
    {
      id: 'data-pipeline',
      name: 'Data Processing Pipeline',
      description: 'Automated data collection, cleaning, and analysis pipeline',
      category: 'data',
      complexity: 'advanced',
      estimatedTime: '4-6 hours',
      agents: 6,
      confidence: 0.85,
      tags: ['Data analysis', 'ETL', 'Visualization'],
      useCases: ['Business intelligence', 'Data migration', 'Real-time analytics'],
      features: ['Data validation', 'Automated reporting', 'Anomaly detection']
    },
    {
      id: 'chatbot-framework',
      name: 'Enterprise Chatbot',
      description: 'Intelligent chatbot with knowledge base integration',
      category: 'communication',
      complexity: 'intermediate',
      estimatedTime: '2-3 hours',
      agents: 3,
      confidence: 0.95,
      tags: ['Live API', 'Knowledge base', 'Multi-turn'],
      useCases: ['Customer support', 'Internal helpdesk', 'FAQ automation'],
      features: ['Context retention', 'Sentiment analysis', 'Escalation handling']
    },
    {
      id: 'content-creator',
      name: 'Content Creation Suite',
      description: 'Automated content generation and optimization system',
      category: 'marketing',
      complexity: 'beginner',
      estimatedTime: '1-2 hours',
      agents: 2,
      confidence: 0.90,
      tags: ['SEO', 'Multimodal', 'Brand voice'],
      useCases: ['Blog posts', 'Social media', 'Email campaigns'],
      features: ['SEO optimization', 'Tone matching', 'Image generation']
    },
    {
      id: 'api-gateway',
      name: 'API Gateway & Monitor',
      description: 'Intelligent API gateway with automated monitoring',
      category: 'infrastructure',
      complexity: 'advanced',
      estimatedTime: '5-7 hours',
      agents: 7,
      confidence: 0.82,
      tags: ['Monitoring', 'Security', 'Load balancing'],
      useCases: ['API management', 'Traffic analysis', 'Security monitoring'],
      features: ['Rate limiting', 'Security scanning', 'Performance monitoring']
    }
  ]

  const categories = [
    { id: 'all', name: 'All Templates', icon: Template, count: templates.length },
    { id: 'research', name: 'Research', icon: Zap, count: templates.filter(t => t.category === 'research').length },
    { id: 'development', name: 'Development', icon: Code, count: templates.filter(t => t.category === 'development').length },
    { id: 'data', name: 'Data', icon: Database, count: templates.filter(t => t.category === 'data').length },
    { id: 'communication', name: 'Communication', icon: Globe, count: templates.filter(t => t.category === 'communication').length },
    { id: 'marketing', name: 'Marketing', icon: TrendingUp, count: templates.filter(t => t.category === 'marketing').length },
    { id: 'infrastructure', name: 'Infrastructure', icon: Cpu, count: templates.filter(t => t.category === 'infrastructure').length }
  ]

  const filteredTemplates = templates.filter(template => {
    if (selectedCategory !== 'all' && template.category !== selectedCategory) return false
    if (selectedComplexity !== 'all' && template.complexity !== selectedComplexity) return false
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !template.description.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-500/20 text-green-400'
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400'
      case 'advanced': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.id === category)
    return categoryData?.icon || Template
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <Template className="text-blue-400" size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Project Templates</h1>
              <p className="text-gray-400">Start building faster with pre-configured agent workflows</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates by name or description..."
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {filteredTemplates.length} templates
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Categories */}
              <div className="mb-8">
                <h3 className="font-medium mb-4">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-colors ${selectedCategory === category.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <Icon size={18} className="text-gray-400" />
                          <span>{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{category.count}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Complexity Filter */}
              <div className="mb-8">
                <h3 className="font-medium mb-4">Complexity</h3>
                <div className="space-y-2">
                  {['all', 'beginner', 'intermediate', 'advanced'].map((complexity) => (
                    <button
                      key={complexity}
                      onClick={() => setSelectedComplexity(complexity)}
                      className={`w-full px-4 py-3 rounded-lg transition-colors text-left capitalize ${selectedComplexity === complexity ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                    >
                      {complexity === 'all' ? 'All Levels' : complexity}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h3 className="font-medium mb-4">Template Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Templates</span>
                    <span className="font-medium">{templates.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Confidence</span>
                    <span className="font-medium text-green-400">
                      {Math.round(templates.reduce((acc, t) => acc + t.confidence, 0) / templates.length * 100)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Agents</span>
                    <span className="font-medium">
                      {Math.round(templates.reduce((acc, t) => acc + t.agents, 0) / templates.length)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="lg:col-span-3">
            <div className="grid md:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const CategoryIcon = getCategoryIcon(template.category)
                return (
                  <div
                    key={template.id}
                    className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-colors group"
                  >
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                            <CategoryIcon className="text-blue-400" size={20} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg group-hover:text-blue-400 transition-colors">
                              {template.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                                {template.complexity}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center">
                                <Users size={12} className="mr-1" />
                                {template.agents} agents
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            {(template.confidence * 100).toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-400">Confidence</div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 mb-6">{template.description}</p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {template.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-400 mb-3">Key Features</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {template.features.map((feature, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                              <span className="text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-6 border-t border-gray-800">
                        <div className="text-sm text-gray-400">
                          Est. time: <span className="text-gray-300">{template.estimatedTime}</span>
                        </div>
                        
                        <Link
                          href={`/projects/new?template=${template.id}`}
                          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform group-hover:scale-105"
                        >
                          <Rocket size={16} />
                          <span>Use Template</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
                  <Template size={48} className="text-gray-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No templates found</h3>
                <p className="text-gray-400 mb-6">Try different filters or search terms</p>
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setSelectedComplexity('all')
                    setSearchQuery('')
                  }}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Create Custom Template */}
            <div className="mt-8">
              <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Zap className="text-blue-400" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Can't find what you need?</h3>
                  <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Create your own custom template with specialized agents and workflows.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                      href="/projects/new"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
                    >
                      Create Custom Template
                    </Link>
                    <Link
                      href="/docs/templates"
                      className="px-6 py-3 border border-gray-700 hover:border-gray-600 rounded-lg font-medium transition-colors"
                    >
                      Learn How to Build
                    </Link>
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