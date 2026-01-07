'use client'

import { useEffect, useState } from 'react'
import ConfidenceBar from './ConfidenceBar'

interface OutputMessage {
  id: string
  agent: string
  content: string
  confidence: number
  timestamp: string
  type: 'research' | 'code' | 'summary'
}

interface AgentOutputProps {
  projectId: string
}

export default function AgentOutput({ projectId }: AgentOutputProps) {
  const [outputs, setOutputs] = useState<OutputMessage[]>([
    {
      id: '1',
      agent: 'Researcher',
      content: 'Analyzing project requirements and researching relevant Gemini API features...',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      type: 'research'
    },
    {
      id: '2',
      agent: 'Architect',
      content: 'Designing system architecture with multiple specialized agents...',
      confidence: 0.92,
      timestamp: new Date().toISOString(),
      type: 'research'
    },
    {
      id: '3',
      agent: 'Builder',
      content: 'Generating code for agent orchestration system...',
      confidence: 0.78,
      timestamp: new Date().toISOString(),
      type: 'code'
    }
  ])
  const [isStreaming, setIsStreaming] = useState(true)

  // Simulate real-time updates
  useEffect(() => {
    if (!isStreaming) return

    const interval = setInterval(() => {
      const newOutput: OutputMessage = {
        id: Date.now().toString(),
        agent: ['Researcher', 'Architect', 'Builder', 'Reviewer'][Math.floor(Math.random() * 4)],
        content: [
          'Analyzing Gemini API documentation for optimal usage patterns...',
          'Generating confidence scoring algorithm...',
          'Creating real-time streaming interface...',
          'Testing agent communication protocols...',
          'Optimizing prompt engineering for better results...'
        ][Math.floor(Math.random() * 5)],
        confidence: Math.random() * 0.2 + 0.7, // 0.7 - 0.9
        timestamp: new Date().toISOString(),
        type: ['research', 'code', 'summary'][Math.floor(Math.random() * 3)] as any
      }
      
      setOutputs(prev => [newOutput, ...prev].slice(0, 20))
    }, 3000)

    return () => clearInterval(interval)
  }, [isStreaming])

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'Researcher': 'text-blue-400',
      'Architect': 'text-purple-400',
      'Builder': 'text-green-400',
      'Reviewer': 'text-yellow-400'
    }
    return colors[agent] || 'text-gray-400'
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      'research': '🔍',
      'code': '💻',
      'summary': '📝'
    }
    return icons[type] || '📄'
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Live Agent Outputs</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm text-gray-400">
              {isStreaming ? 'Streaming Live' : 'Paused'}
            </span>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isStreaming ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {outputs.map((output) => (
          <div
            key={output.id}
            className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <span className="text-lg">{getTypeIcon(output.type)}</span>
                <span className={`font-medium ${getAgentColor(output.agent)}`}>
                  {output.agent}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(output.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <ConfidenceBar confidence={output.confidence} />
            </div>
            <p className="text-gray-300 text-sm">{output.content}</p>
            <div className="mt-2 text-xs text-gray-500">
              Confidence: {(output.confidence * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {outputs.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No agent outputs yet. Start a project to begin streaming!
        </div>
      )}
    </div>
  )
}