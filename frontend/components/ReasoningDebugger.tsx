'use client'

import { useState, useEffect } from 'react'
import { Brain, Search, Filter, ZoomIn, ZoomOut, RefreshCw, Download } from 'lucide-react'

interface ReasoningStep {
  id: string
  timestamp: string
  agent: string
  thought: string
  action: string
  result: string
  confidence: number
  reasoningChain: string[]
  model: string
  tokensUsed: number
}

interface ReasoningDebuggerProps {
  projectId: string
  steps: ReasoningStep[]
  onStepSelect?: (stepId: string) => void
}

export default function ReasoningDebugger({ projectId, steps, onStepSelect }: ReasoningDebuggerProps) {
  const [selectedStep, setSelectedStep] = useState<string | null>(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [zoom, setZoom] = useState(1)
  const [expandedChains, setExpandedChains] = useState<Set<string>>(new Set())

  const filteredSteps = steps.filter(step => {
    if (filter !== 'all' && step.agent.toLowerCase() !== filter) return false
    if (search && !step.thought.toLowerCase().includes(search.toLowerCase()) && 
        !step.action.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const toggleChain = (stepId: string) => {
    const newSet = new Set(expandedChains)
    if (newSet.has(stepId)) {
      newSet.delete(stepId)
    } else {
      newSet.add(stepId)
    }
    setExpandedChains(newSet)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400 bg-green-400/10'
    if (confidence >= 0.7) return 'text-yellow-400 bg-yellow-400/10'
    return 'text-red-400 bg-red-400/10'
  }

  const agents = Array.from(new Set(steps.map(step => step.agent.toLowerCase())))

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Brain className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Reasoning Debugger</h3>
            <p className="text-sm text-gray-400">Trace agent thought processes and decisions</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 1.5))}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search reasoning steps..."
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Agents</option>
              {agents.map(agent => (
                <option key={agent} value={agent}>
                  {agent.charAt(0).toUpperCase() + agent.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <RefreshCw size={18} />
          </button>
          
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Reasoning Timeline */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2" style={{ zoom }}>
        {filteredSteps.map((step, index) => (
          <div
            key={step.id}
            className={`border rounded-lg overflow-hidden transition-all ${selectedStep === step.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800 hover:border-gray-700'}`}
            onClick={() => {
              setSelectedStep(step.id)
              onStepSelect?.(step.id)
            }}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  <div>
                    <div className="font-medium">{step.agent}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(step.confidence)}`}>
                    {(step.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-400">
                    {step.tokensUsed.toLocaleString()} tokens
                  </span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 mb-3">
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Thought Process</div>
                  <p className="text-sm text-gray-300">{step.thought}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Action Taken</div>
                  <p className="text-sm text-gray-300">{step.action}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-400 mb-1">Result</div>
                  <p className="text-sm text-gray-300">{step.result}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Model: <span className="text-gray-300">{step.model}</span>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleChain(step.id)
                  }}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {expandedChains.has(step.id) ? 'Hide Chain' : 'Show Chain'}
                </button>
              </div>
            </div>
            
            {/* Expanded Reasoning Chain */}
            {expandedChains.has(step.id) && (
              <div className="border-t border-gray-800 p-4 bg-gray-900/30">
                <div className="text-sm font-medium text-gray-400 mb-3">Reasoning Chain</div>
                <div className="space-y-2">
                  {step.reasoningChain.map((chain, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center mt-1 flex-shrink-0">
                        <span className="text-xs">{idx + 1}</span>
                      </div>
                      <div className="text-sm text-gray-300">{chain}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredSteps.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400">No reasoning steps found. Start a project to see agent thinking.</p>
        </div>
      )}

      {/* Statistics */}
      {steps.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <h4 className="font-medium mb-4">Reasoning Statistics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold mb-1">{steps.length}</div>
              <div className="text-sm text-gray-400">Total Steps</div>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {steps.reduce((acc, step) => acc + step.tokensUsed, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-400">Tokens Used</div>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {(steps.reduce((acc, step) => acc + step.confidence, 0) / steps.length * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
            
            <div className="p-4 bg-gray-800/30 rounded-lg">
              <div className="text-2xl font-bold mb-1">
                {Array.from(new Set(steps.map(s => s.agent))).length}
              </div>
              <div className="text-sm text-gray-400">Unique Agents</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}