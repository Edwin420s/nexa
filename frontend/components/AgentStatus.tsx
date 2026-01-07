'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface Agent {
  id: string
  name: string
  type: 'researcher' | 'architect' | 'builder' | 'reviewer' | 'optimizer'
  status: 'idle' | 'running' | 'completed' | 'failed'
  confidence: number
  currentTask?: string
  progress: number
  model: string
}

interface AgentStatusProps {
  agents: Agent[]
  onAgentAction?: (agentId: string, action: 'start' | 'stop' | 'restart') => void
}

export default function AgentStatus({ agents, onAgentAction }: AgentStatusProps) {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null)

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'running': return 'text-green-400 bg-green-400/10'
      case 'completed': return 'text-blue-400 bg-blue-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'running': return <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      case 'completed': return <CheckCircle size={14} />
      case 'failed': return <AlertCircle size={14} />
      default: return <div className="w-2 h-2 rounded-full bg-gray-400" />
    }
  }

  const getAgentIcon = (type: Agent['type']) => {
    const icons: Record<Agent['type'], string> = {
      researcher: '🔍',
      architect: '🏗️',
      builder: '👷',
      reviewer: '👀',
      optimizer: '⚡'
    }
    return icons[type]
  }

  return (
    <div className="space-y-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden"
        >
          {/* Agent Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getAgentIcon(agent.type)}</span>
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(agent.status)}`}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(agent.status)}
                        <span className="capitalize">{agent.status}</span>
                      </span>
                    </span>
                    <span className="text-xs text-gray-400">{agent.model}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="text-sm font-medium">{(agent.confidence * 100).toFixed(1)}%</div>
                  <div className="text-xs text-gray-400">Confidence</div>
                </div>
                
                <button
                  onClick={() => setExpandedAgent(expandedAgent === agent.id ? null : agent.id)}
                  className="ml-4 px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                >
                  {expandedAgent === agent.id ? 'Hide' : 'Details'}
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">Progress</span>
                <span className="font-medium">{agent.progress}%</span>
              </div>
              <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${agent.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedAgent === agent.id && (
            <div className="border-t border-gray-800 p-4 bg-gray-900/30">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Current Task</h4>
                  <p className="text-sm text-gray-300">
                    {agent.currentTask || 'Waiting for assignment...'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Actions</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onAgentAction?.(agent.id, agent.status === 'running' ? 'stop' : 'start')}
                      className={`flex items-center space-x-2 px-3 py-2 rounded text-sm ${agent.status === 'running' ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                    >
                      {agent.status === 'running' ? <Pause size={14} /> : <Play size={14} />}
                      <span>{agent.status === 'running' ? 'Pause' : 'Start'}</span>
                    </button>
                    <button
                      onClick={() => onAgentAction?.(agent.id, 'restart')}
                      className="flex items-center space-x-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Restart</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-800">
                <div>
                  <div className="text-xs text-gray-400">Tasks Completed</div>
                  <div className="text-lg font-semibold">12/15</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Avg Time</div>
                  <div className="text-lg font-semibold">45s</div>
                </div>
                <div>
                  <div className="text-xs text-gray-400">Success Rate</div>
                  <div className="text-lg font-semibold">92%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {agents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No agents running. Start a project to launch agents.
        </div>
      )}
    </div>
  )
}