'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Settings, Zap, Cpu, Network, GitBranch, GitMerge, Workflow } from 'lucide-react'

interface AgentNode {
  id: string
  type: 'researcher' | 'architect' | 'builder' | 'reviewer' | 'optimizer' | 'gateway'
  name: string
  x: number
  y: number
  status: 'idle' | 'running' | 'success' | 'error'
  confidence: number
  inputs: string[]
  outputs: string[]
  connections: string[]
}

interface AgentOrchestratorProps {
  projectId: string
  onRun?: () => void
  onConfigure?: (agentId: string) => void
}

export default function AgentOrchestrator({ projectId, onRun, onConfigure }: AgentOrchestratorProps) {
  const [nodes, setNodes] = useState<AgentNode[]>([
    {
      id: 'gateway-1',
      type: 'gateway',
      name: 'Start',
      x: 100,
      y: 250,
      status: 'success',
      confidence: 1.0,
      inputs: [],
      outputs: ['researcher-1'],
      connections: ['researcher-1']
    },
    {
      id: 'researcher-1',
      type: 'researcher',
      name: 'Research Agent',
      x: 300,
      y: 150,
      status: 'running',
      confidence: 0.85,
      inputs: ['gateway-1'],
      outputs: ['architect-1', 'architect-2'],
      connections: ['architect-1', 'architect-2']
    },
    {
      id: 'architect-1',
      type: 'architect',
      name: 'System Architect',
      x: 500,
      y: 100,
      status: 'running',
      confidence: 0.92,
      inputs: ['researcher-1'],
      outputs: ['builder-1'],
      connections: ['builder-1']
    },
    {
      id: 'architect-2',
      type: 'architect',
      name: 'API Architect',
      x: 500,
      y: 200,
      status: 'success',
      confidence: 0.88,
      inputs: ['researcher-1'],
      outputs: ['builder-2'],
      connections: ['builder-2']
    },
    {
      id: 'builder-1',
      type: 'builder',
      name: 'Core Builder',
      x: 700,
      y: 100,
      status: 'running',
      confidence: 0.78,
      inputs: ['architect-1'],
      outputs: ['reviewer-1'],
      connections: ['reviewer-1']
    },
    {
      id: 'builder-2',
      type: 'builder',
      name: 'API Builder',
      x: 700,
      y: 200,
      status: 'idle',
      confidence: 0.0,
      inputs: ['architect-2'],
      outputs: ['reviewer-1'],
      connections: ['reviewer-1']
    },
    {
      id: 'reviewer-1',
      type: 'reviewer',
      name: 'Quality Reviewer',
      x: 900,
      y: 150,
      status: 'idle',
      confidence: 0.0,
      inputs: ['builder-1', 'builder-2'],
      outputs: ['optimizer-1'],
      connections: ['optimizer-1']
    },
    {
      id: 'optimizer-1',
      type: 'optimizer',
      name: 'Performance Optimizer',
      x: 1100,
      y: 150,
      status: 'idle',
      confidence: 0.0,
      inputs: ['reviewer-1'],
      outputs: ['gateway-2'],
      connections: ['gateway-2']
    },
    {
      id: 'gateway-2',
      type: 'gateway',
      name: 'End',
      x: 1300,
      y: 150,
      status: 'idle',
      confidence: 0.0,
      inputs: ['optimizer-1'],
      outputs: [],
      connections: []
    }
  ])

  const [isRunning, setIsRunning] = useState(true)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  const getNodeColor = (type: AgentNode['type']) => {
    switch (type) {
      case 'researcher': return 'from-blue-500 to-blue-600'
      case 'architect': return 'from-purple-500 to-purple-600'
      case 'builder': return 'from-green-500 to-green-600'
      case 'reviewer': return 'from-yellow-500 to-yellow-600'
      case 'optimizer': return 'from-pink-500 to-pink-600'
      case 'gateway': return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusColor = (status: AgentNode['status']) => {
    switch (status) {
      case 'running': return 'border-blue-500 bg-blue-500/20'
      case 'success': return 'border-green-500 bg-green-500/20'
      case 'error': return 'border-red-500 bg-red-500/20'
      default: return 'border-gray-500 bg-gray-500/20'
    }
  }

  const getNodeIcon = (type: AgentNode['type']) => {
    switch (type) {
      case 'researcher': return '🔍'
      case 'architect': return '🏗️'
      case 'builder': return '👷'
      case 'reviewer': return '👀'
      case 'optimizer': return '⚡'
      case 'gateway': return '⚫'
    }
  }

  // Simulate agent execution flow
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setNodes(prev => {
        const newNodes = [...prev]
        const runningNodeIndex = newNodes.findIndex(node => node.status === 'running')
        
        if (runningNodeIndex >= 0) {
          // Complete current node
          newNodes[runningNodeIndex].status = 'success'
          newNodes[runningNodeIndex].confidence = 0.9 + Math.random() * 0.1
          
          // Start next nodes
          newNodes[runningNodeIndex].connections.forEach(connectionId => {
            const nextNodeIndex = newNodes.findIndex(node => node.id === connectionId)
            if (nextNodeIndex >= 0 && newNodes[nextNodeIndex].status === 'idle') {
              newNodes[nextNodeIndex].status = 'running'
              newNodes[nextNodeIndex].confidence = 0.7 + Math.random() * 0.2
            }
          })
        } else {
          // Restart from beginning
          newNodes.forEach(node => {
            if (node.type === 'gateway' && node.name === 'Start') {
              node.status = 'success'
            } else {
              node.status = 'idle'
              node.confidence = 0
            }
          })
          const startNodeIndex = newNodes.findIndex(node => node.type === 'gateway' && node.name === 'Start')
          if (startNodeIndex >= 0 && newNodes[startNodeIndex].connections.length > 0) {
            const firstNodeId = newNodes[startNodeIndex].connections[0]
            const firstNodeIndex = newNodes.findIndex(node => node.id === firstNodeId)
            if (firstNodeIndex >= 0) {
              newNodes[firstNodeIndex].status = 'running'
              newNodes[firstNodeIndex].confidence = 0.7 + Math.random() * 0.2
            }
          }
        }
        
        return newNodes
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isRunning])

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border-2 border-blue-500/30 shadow-glow-blue">
            <Workflow className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Agent Orchestrator</h3>
            <p className="text-sm text-gray-400">Visual workflow of autonomous agents</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setZoom(prev => Math.min(prev + 0.1, 2))}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              +
            </button>
            <span className="text-sm text-gray-400">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.5))}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              -
            </button>
          </div>
          
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${isRunning ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
          >
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
            <span>{isRunning ? 'Pause' : 'Run'}</span>
          </button>
          
          <button
            onClick={onRun}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg rounded-lg font-medium"
          >
            <Zap size={18} />
            <span>Execute All</span>
          </button>
        </div>
      </div>

      {/* Orchestration Canvas */}
      <div className="relative h-[500px] bg-gray-900 border border-gray-800 rounded-lg overflow-auto">
        <div 
          className="min-w-full min-h-full p-8"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          {/* Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {nodes.map(node => 
              node.connections.map(connectionId => {
                const targetNode = nodes.find(n => n.id === connectionId)
                if (!targetNode) return null
                
                const sourceX = node.x + 120
                const sourceY = node.y + 40
                const targetX = targetNode.x
                const targetY = targetNode.y + 40
                
                return (
                  <line
                    key={`${node.id}-${connectionId}`}
                    x1={sourceX}
                    y1={sourceY}
                    x2={targetX}
                    y2={targetY}
                    stroke={node.status === 'success' ? '#10b981' : '#4b5563'}
                    strokeWidth="2"
                    strokeDasharray={node.status === 'success' ? 'none' : '5,5'}
                  />
                )
              })
            )}
          </svg>

          {/* Agent Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute w-40 h-20 rounded-xl border-2 ${getStatusColor(node.status)} ${selectedNode === node.id ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-900' : ''}`}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              onClick={() => setSelectedNode(node.id)}
            >
              <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-gradient-to-br ${getNodeColor(node.type)} flex items-center justify-center text-white font-bold text-lg`}>
                {getNodeIcon(node.type)}
              </div>
              
              <div className="pt-6 px-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm font-medium truncate">{node.name}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onConfigure?.(node.id)
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <Settings size={14} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 capitalize">{node.status}</span>
                  <span className="font-medium">
                    {node.confidence > 0 ? `${(node.confidence * 100).toFixed(0)}%` : '0%'}
                  </span>
                </div>
                
                {/* Progress bar */}
                {node.status === 'running' && (
                  <div className="mt-2 w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500shadow-glow-blue animate-pulse"
                      style={{ width: `${node.confidence * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-6 border-t border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" />
          <span className="text-sm text-gray-400">Researcher</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-purple-600" />
          <span className="text-sm text-gray-400">Architect</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-green-600" />
          <span className="text-sm text-gray-400">Builder</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600" />
          <span className="text-sm text-gray-400">Reviewer</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-pink-500 to-pink-600" />
          <span className="text-sm text-gray-400">Optimizer</span>
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Node Configuration</h4>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          {(() => {
            const node = nodes.find(n => n.id === selectedNode)
            if (!node) return null
            
            return (
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Details</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type</span>
                      <span className="font-medium capitalize">{node.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span className="font-medium capitalize">{node.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confidence</span>
                      <span className="font-medium">{(node.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connections</span>
                      <span className="font-medium">{node.connections.length}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Gemini Model</h5>
                  <select className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500">
                    <option>Gemini 3 Pro (Recommended)</option>
                    <option>Gemini 2.5 Flash</option>
                    <option>Gemini 2.5 Pro</option>
                  </select>
                  
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-400 mb-2">Agent Prompt</h5>
                    <textarea
                      className="w-full h-24 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-sm"
                      placeholder="Custom agent instructions..."
                      defaultValue={`You are a ${node.type} agent. Your task is to...`}
                    />
                  </div>
                </div>
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}