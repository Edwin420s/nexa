'use client'

import { useState } from 'react'
import { Check, Zap, DollarSign, Clock, AlertCircle } from 'lucide-react'

interface Model {
  id: string
  name: string
  provider: 'gemini' | 'openai' | 'anthropic' | 'custom'
  description: string
  capabilities: string[]
  costPer1K: number
  speed: 'slow' | 'medium' | 'fast'
  maxTokens: number
  contextWindow: number
  recommendedFor: string[]
}

interface ModelSelectorProps {
  models: Model[]
  selectedModel: string
  onSelect: (modelId: string) => void
  budget?: number
  speedRequirement?: 'slow' | 'medium' | 'fast'
  taskType?: string
}

export default function ModelSelector({
  models,
  selectedModel,
  onSelect,
  budget,
  speedRequirement = 'medium',
  taskType = 'general'
}: ModelSelectorProps) {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState<'all' | 'gemini' | 'fast' | 'cheap'>('all')

  const filteredModels = models.filter(model => {
    if (filter === 'gemini') return model.provider === 'gemini'
    if (filter === 'fast') return model.speed === 'fast'
    if (filter === 'cheap') return model.costPer1K < 0.5
    return true
  })

  const getProviderColor = (provider: Model['provider']) => {
    switch (provider) {
      case 'gemini': return 'bg-gradient-to-r from-blue-500 to-blue-600'
      case 'openai': return 'bg-gradient-to-r from-green-500 to-emerald-600'
      case 'anthropic': return 'bg-gradient-to-r from-purple-500 to-pink-600'
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  }

  const getSpeedColor = (speed: Model['speed']) => {
    switch (speed) {
      case 'fast': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'slow': return 'text-red-400 bg-red-400/10'
    }
  }

  const getCostColor = (cost: number) => {
    if (cost < 0.1) return 'text-green-400'
    if (cost < 0.5) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">AI Model Selection</h3>
          <p className="text-sm text-gray-400">Choose the optimal model for your task</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setView('grid')}
              className={`px-3 py-2 text-sm ${view === 'grid' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 text-sm ${view === 'list' ? 'bg-gray-800' : 'hover:bg-gray-800'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          All Models
        </button>
        <button
          onClick={() => setFilter('gemini')}
          className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'gemini' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          Gemini Only
        </button>
        <button
          onClick={() => setFilter('fast')}
          className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'fast' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          Fast
        </button>
        <button
          onClick={() => setFilter('cheap')}
          className={`px-3 py-1.5 rounded-lg text-sm ${filter === 'cheap' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
        >
          Cost Effective
        </button>
      </div>

      {/* Models Grid/List */}
      {view === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${selectedModel === model.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700'}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getProviderColor(model.provider)}`}>
                      {model.provider.toUpperCase()}
                    </span>
                    {model.recommendedFor.includes(taskType) && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500">
                        Recommended
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold mb-1">{model.name}</h4>
                  <p className="text-sm text-gray-400">{model.description}</p>
                </div>
                
                {selectedModel === model.id && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center ml-2">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Capabilities */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Capabilities</div>
                  <div className="flex flex-wrap gap-1">
                    {model.capabilities.slice(0, 3).map((cap, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-800 text-xs rounded">
                        {cap}
                      </span>
                    ))}
                    {model.capabilities.length > 3 && (
                      <span className="px-2 py-1 bg-gray-800 text-xs rounded">
                        +{model.capabilities.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <DollarSign size={12} className={getCostColor(model.costPer1K)} />
                    </div>
                    <div className={getCostColor(model.costPer1K)}>${model.costPer1K.toFixed(3)}</div>
                    <div className="text-xs text-gray-500">per 1K</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Zap size={12} className={getSpeedColor(model.speed).split(' ')[0]} />
                    </div>
                    <span className={getSpeedColor(model.speed).split(' ')[0]}>
                      {model.speed}
                    </span>
                    <div className="text-xs text-gray-500">speed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-1">
                      <Clock size={12} className="text-blue-400" />
                    </div>
                    <div>{model.maxTokens.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">tokens</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedModel === model.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${selectedModel === model.id ? 'bg-blue-500' : 'bg-gray-700'}`} />
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getProviderColor(model.provider)}`}>
                        {model.provider.toUpperCase()}
                      </span>
                      <h4 className="font-semibold">{model.name}</h4>
                      {model.recommendedFor.includes(taskType) && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{model.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getCostColor(model.costPer1K)}`}>
                      ${model.costPer1K.toFixed(3)}/1K
                    </div>
                    <div className="text-xs text-gray-400">Cost</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getSpeedColor(model.speed).split(' ')[0]}`}>
                      {model.speed}
                    </div>
                    <div className="text-xs text-gray-400">Speed</div>
                  </div>
                  
                  {selectedModel === model.id && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredModels.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No models match your filters. Try different criteria.</p>
        </div>
      )}

      {/* Selection Summary */}
      {selectedModel && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold mb-1">Selected Model</h4>
              <p className="text-sm text-gray-400">
                {models.find(m => m.id === selectedModel)?.name}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-400 mb-1">Estimated Cost</div>
              <div className="text-xl font-bold">
                ${(budget || 10).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Example models
export const exampleModels: Model[] = [
  {
    id: 'gemini-3-pro',
    name: 'Gemini 3 Pro',
    provider: 'gemini',
    description: 'Most capable model for complex reasoning and multi-step tasks',
    capabilities: ['Complex reasoning', 'Multi-step planning', 'Code generation', 'Research'],
    costPer1K: 0.00125,
    speed: 'medium',
    maxTokens: 8192,
    contextWindow: 1000000,
    recommendedFor: ['research', 'planning', 'analysis']
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    description: 'Fast and efficient for most agentic workflows',
    capabilities: ['Fast responses', 'Function calling', 'Structured outputs'],
    costPer1K: 0.00035,
    speed: 'fast',
    maxTokens: 8192,
    contextWindow: 1000000,
    recommendedFor: ['agentic', 'real-time', 'cost-sensitive']
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Balanced performance for general AI tasks',
    capabilities: ['General reasoning', 'Creative tasks', 'Analysis'],
    costPer1K: 0.0025,
    speed: 'medium',
    maxTokens: 4096,
    contextWindow: 128000,
    recommendedFor: ['general', 'creative', 'analysis']
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Excellent for long-form content and complex analysis',
    capabilities: ['Long context', 'Detailed analysis', 'Writing'],
    costPer1K: 0.015,
    speed: 'slow',
    maxTokens: 4096,
    contextWindow: 200000,
    recommendedFor: ['writing', 'analysis', 'long-form']
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'custom',
    description: 'Open-source model for cost-sensitive deployments',
    capabilities: ['Code generation', 'Reasoning', 'General tasks'],
    costPer1K: 0.0008,
    speed: 'medium',
    maxTokens: 8192,
    contextWindow: 131072,
    recommendedFor: ['code', 'cost-sensitive', 'general']
  }
]