'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, Zap, Shield, Database, Cpu, GitBranch, CheckCircle, XCircle, Play } from 'lucide-react'

interface ErrorEvent {
  id: string
  timestamp: string
  agent: string
  errorType: string
  errorMessage: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'detected' | 'analyzing' | 'recovering' | 'resolved' | 'failed'
  recoveryAttempts: number
  automaticRecovery: boolean
  solution?: string
  resolvedAt?: string
}

interface RecoveryStrategy {
  id: string
  name: string
  description: string
  triggers: string[]
  actions: string[]
  successRate: number
  avgRecoveryTime: string
}

interface ErrorRecoveryProps {
  projectId?: string
  onAutoRecoveryToggle?: (enabled: boolean) => void
}

export default function ErrorRecovery({ projectId, onAutoRecoveryToggle }: ErrorRecoveryProps) {
  const [errors, setErrors] = useState<ErrorEvent[]>([
    {
      id: 'err-1',
      timestamp: '2024-01-07T10:05:00Z',
      agent: 'Researcher',
      errorType: 'API Rate Limit',
      errorMessage: 'Gemini API rate limit exceeded. Too many requests.',
      severity: 'medium',
      status: 'resolved',
      recoveryAttempts: 2,
      automaticRecovery: true,
      solution: 'Implemented exponential backoff and request queuing.',
      resolvedAt: '2024-01-07T10:10:00Z'
    },
    {
      id: 'err-2',
      timestamp: '2024-01-07T09:30:00Z',
      agent: 'Builder',
      errorType: 'Code Generation Error',
      errorMessage: 'Generated code contains syntax errors in JavaScript.',
      severity: 'high',
      status: 'recovering',
      recoveryAttempts: 1,
      automaticRecovery: true,
      solution: 'Running syntax checker and regeneration with corrected patterns.'
    },
    {
      id: 'err-3',
      timestamp: '2024-01-07T09:15:00Z',
      agent: 'Architect',
      errorType: 'Memory Overflow',
      errorMessage: 'Context window exceeded 1M tokens during analysis.',
      severity: 'critical',
      status: 'detected',
      recoveryAttempts: 0,
      automaticRecovery: false
    },
    {
      id: 'err-4',
      timestamp: '2024-01-07T08:45:00Z',
      agent: 'Reviewer',
      errorType: 'Validation Failure',
      errorMessage: 'Output validation failed quality threshold (confidence < 70%).',
      severity: 'low',
      status: 'resolved',
      recoveryAttempts: 3,
      automaticRecovery: true,
      solution: 'Increased validation threshold and added retry logic.',
      resolvedAt: '2024-01-07T09:00:00Z'
    }
  ])

  const [recoveryStrategies, setRecoveryStrategies] = useState<RecoveryStrategy[]>([
    {
      id: 'strat-1',
      name: 'Exponential Backoff',
      description: 'Automatically retry failed API calls with increasing delays',
      triggers: ['API Rate Limit', 'Network Error', 'Timeout'],
      actions: ['Delay retry', 'Reduce batch size', 'Switch endpoints'],
      successRate: 0.95,
      avgRecoveryTime: '2 minutes'
    },
    {
      id: 'strat-2',
      name: 'Code Validation & Regeneration',
      description: 'Validate generated code and regenerate if errors found',
      triggers: ['Syntax Error', 'Runtime Error', 'Type Error'],
      actions: ['Run linter', 'Test execution', 'Regenerate with feedback'],
      successRate: 0.88,
      avgRecoveryTime: '5 minutes'
    },
    {
      id: 'strat-3',
      name: 'Context Management',
      description: 'Handle large context windows with chunking and summarization',
      triggers: ['Memory Overflow', 'Token Limit', 'Context Too Large'],
      actions: ['Chunk documents', 'Summarize content', 'Prioritize information'],
      successRate: 0.92,
      avgRecoveryTime: '3 minutes'
    },
    {
      id: 'strat-4',
      name: 'Agent Fallback',
      description: 'Switch to alternative agent or model when primary fails',
      triggers: ['Model Unavailable', 'Quality Threshold', 'Confidence Low'],
      actions: ['Switch model', 'Activate backup agent', 'Adjust parameters'],
      successRate: 0.85,
      avgRecoveryTime: '1 minute'
    }
  ])

  const [autoRecovery, setAutoRecovery] = useState(true)
  const [activeError, setActiveError] = useState<string | null>(null)
  const [recoveryProgress, setRecoveryProgress] = useState(0)

  const getSeverityColor = (severity: ErrorEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-400/10'
      case 'high': return 'text-orange-400 bg-orange-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'low': return 'text-blue-400 bg-blue-400/10'
    }
  }

  const getStatusColor = (status: ErrorEvent['status']) => {
    switch (status) {
      case 'resolved': return 'text-green-400 bg-green-400/10'
      case 'recovering': return 'text-blue-400 bg-blue-400/10'
      case 'analyzing': return 'text-yellow-400 bg-yellow-400/10'
      default: return 'text-red-400 bg-red-400/10'
    }
  }

  const triggerRecovery = (errorId: string) => {
    setErrors(prev => prev.map(error => {
      if (error.id === errorId) {
        setActiveError(errorId)
        setRecoveryProgress(0)
        
        // Simulate recovery progress
        const interval = setInterval(() => {
          setRecoveryProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval)
              
              // Mark as resolved
              setErrors(prevErrors => prevErrors.map(e => 
                e.id === errorId 
                  ? { 
                      ...e, 
                      status: 'resolved', 
                      resolvedAt: new Date().toISOString(),
                      solution: 'Automatically resolved by recovery system.'
                    }
                  : e
              ))
              
              setActiveError(null)
              return 100
            }
            return prev + 10
          })
        }, 500)

        return { ...error, status: 'recovering' as const }
      }
      return error
    }))
  }

  const simulateNewError = () => {
    const errorTypes = ['Network Error', 'Validation Failed', 'Timeout', 'Resource Exhausted']
    const agents = ['Researcher', 'Architect', 'Builder', 'Reviewer', 'Optimizer']
    
    const newError: ErrorEvent = {
      id: `err-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: agents[Math.floor(Math.random() * agents.length)],
      errorType: errorTypes[Math.floor(Math.random() * errorTypes.length)],
      errorMessage: `Simulated error for testing recovery system. ${Math.random().toString(36).substring(7)}`,
      severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
      status: 'detected',
      recoveryAttempts: 0,
      automaticRecovery: autoRecovery
    }

    setErrors(prev => [newError, ...prev])
    
    if (autoRecovery) {
      setTimeout(() => triggerRecovery(newError.id), 1000)
    }
  }

  useEffect(() => {
    onAutoRecoveryToggle?.(autoRecovery)
  }, [autoRecovery, onAutoRecoveryToggle])

  const stats = {
    totalErrors: errors.length,
    resolvedErrors: errors.filter(e => e.status === 'resolved').length,
    autoRecovered: errors.filter(e => e.automaticRecovery && e.status === 'resolved').length,
    avgRecoveryTime: '2.5 minutes',
    successRate: 0.92
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Shield className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Error Recovery System</h3>
            <p className="text-sm text-gray-400">Automatic detection and recovery from agent errors</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${autoRecovery ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <span className="text-sm">Auto-recovery</span>
            <button
              onClick={() => setAutoRecovery(!autoRecovery)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoRecovery ? 'bg-green-500' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoRecovery ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          
          <button
            onClick={simulateNewError}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium"
          >
            <Zap size={18} />
            <span>Test Recovery</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold mb-1">{stats.totalErrors}</div>
          <div className="text-sm text-gray-400">Total Errors</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-400 mb-1">{stats.resolvedErrors}</div>
          <div className="text-sm text-gray-400">Resolved</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-400 mb-1">{stats.autoRecovered}</div>
          <div className="text-sm text-gray-400">Auto-recovered</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-400 mb-1">
            {(stats.successRate * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-400">Success Rate</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Error Events */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recent Error Events</h4>
            <span className="text-sm text-gray-400">
              {errors.filter(e => e.status !== 'resolved').length} active
            </span>
          </div>
          
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {errors.map((error) => (
              <div
                key={error.id}
                className={`border rounded-lg p-4 ${activeError === error.id ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-800'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(error.severity)}`}>
                        {error.severity.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(error.status)}`}>
                        {error.status.toUpperCase()}
                      </span>
                      {error.automaticRecovery && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                          AUTO
                        </span>
                      )}
                    </div>
                    
                    <div className="font-medium mb-1">{error.errorType}</div>
                    <div className="text-sm text-gray-400">{error.agent} • {new Date(error.timestamp).toLocaleTimeString()}</div>
                  </div>
                  
                  {error.status === 'resolved' ? (
                    <CheckCircle className="text-green-400" size={20} />
                  ) : error.status === 'recovering' ? (
                    <RefreshCw className="text-blue-400 animate-spin" size={20} />
                  ) : (
                    <AlertTriangle className="text-red-400" size={20} />
                  )}
                </div>
                
                <p className="text-sm text-gray-300 mb-3">{error.errorMessage}</p>
                
                {error.solution && (
                  <div className="p-3 bg-gray-800/30 border border-gray-700 rounded-lg mb-3">
                    <div className="text-sm font-medium text-green-400 mb-1">Solution Applied</div>
                    <p className="text-sm text-gray-300">{error.solution}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Attempts: {error.recoveryAttempts}
                    {error.resolvedAt && ` • Resolved: ${new Date(error.resolvedAt).toLocaleTimeString()}`}
                  </div>
                  
                  {error.status !== 'resolved' && error.status !== 'recovering' && (
                    <button
                      onClick={() => triggerRecovery(error.id)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                    >
                      <RefreshCw size={14} />
                      <span>Recover</span>
                    </button>
                  )}
                </div>
                
                {activeError === error.id && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Recovery Progress</span>
                      <span className="font-medium">{recoveryProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                        style={{ width: `${recoveryProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recovery Strategies */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Recovery Strategies</h4>
            <span className="text-sm text-gray-400">
              {recoveryStrategies.length} active strategies
            </span>
          </div>
          
          <div className="space-y-4">
            {recoveryStrategies.map((strategy) => (
              <div key={strategy.id} className="border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium mb-1">{strategy.name}</h5>
                    <p className="text-sm text-gray-400">{strategy.description}</p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {(strategy.successRate * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">Success Rate</div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="text-sm font-medium text-gray-400 mb-2">Triggers</div>
                  <div className="flex flex-wrap gap-2">
                    {strategy.triggers.map((trigger, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                        {trigger}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-400 mb-2">Actions</div>
                  <div className="space-y-2">
                    {strategy.actions.map((action, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                        <span className="text-gray-300">{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                  <div className="text-sm text-gray-400">
                    Avg. Recovery: {strategy.avgRecoveryTime}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors">
                      Edit
                    </button>
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
                      Test
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Recovery Analytics */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-900/20 to-blue-900/5 border border-blue-800/30 rounded-lg">
            <h5 className="font-medium mb-3">Recovery Analytics</h5>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Most Common Error</span>
                  <span className="font-medium">API Rate Limit (42%)</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-2/5 h-full bg-gradient-to-r from-red-500 to-orange-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Fastest Recovery</span>
                  <span className="font-medium">Network Errors (45s avg)</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-gradient-to-r from-green-500 to-emerald-500" />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Prevention Rate</span>
                  <span className="font-medium">68% errors prevented</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-gradient-to-r from-blue-500 to-purple-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}