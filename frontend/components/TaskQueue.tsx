'use client'

import { useState } from 'react'
import { Play, Pause, X, Check, Clock, AlertCircle, ListTodo } from 'lucide-react'

interface Task {
  id: string
  agent: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high'
  estimatedTime: number // minutes
  progress: number
  startedAt?: string
  completedAt?: string
}

interface TaskQueueProps {
  tasks: Task[]
  onTaskAction?: (taskId: string, action: 'start' | 'pause' | 'cancel' | 'retry') => void
}

export default function TaskQueue({ tasks, onTaskAction }: TaskQueueProps) {
  const [expandedTask, setExpandedTask] = useState<string | null>(null)

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'running': return 'text-blue-400 bg-blue-400/10'
      case 'completed': return 'text-green-400 bg-green-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running': return <Play size={12} />
      case 'completed': return <Check size={12} />
      case 'failed': return <AlertCircle size={12} />
      default: return <Clock size={12} />
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/20 border-2 border-blue-500/30 shadow-glow-blue">
            <ListTodo className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Task Queue</h3>
            <p className="text-sm text-gray-400">Agent task execution pipeline</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold">
            {tasks.filter(t => t.status === 'completed').length}/{tasks.length}
          </div>
          <div className="text-sm text-gray-400">Tasks Completed</div>
        </div>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                    <span className="flex items-center space-x-1">
                      {getStatusIcon(task.status)}
                      <span className="capitalize">{task.status}</span>
                    </span>
                  </span>
                  
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority} priority
                  </span>
                  
                  <span className="text-xs text-gray-500">
                    {task.agent}
                  </span>
                </div>
                
                <p className="text-sm text-gray-300">{task.description}</p>
                
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" />
                      {formatDuration(task.estimatedTime)}
                    </span>
                    
                    {task.startedAt && (
                      <span>
                        Started: {new Date(task.startedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => onTaskAction?.(task.id, 'start')}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        Start
                      </button>
                    )}
                    
                    {task.status === 'running' && (
                      <button
                        onClick={() => onTaskAction?.(task.id, 'pause')}
                        className="px-3 py-1 text-xs bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                      >
                        Pause
                      </button>
                    )}
                    
                    {(task.status === 'running' || task.status === 'failed') && (
                      <button
                        onClick={() => onTaskAction?.(task.id, 'cancel')}
                        className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 rounded transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    
                    {task.status === 'failed' && (
                      <button
                        onClick={() => onTaskAction?.(task.id, 'retry')}
                        className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 rounded transition-colors"
                      >
                        Retry
                      </button>
                    )}
                    
                    <button
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                    >
                      {expandedTask === task.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {(task.status === 'running' || task.status === 'completed') && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Progress</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      task.status === 'completed' 
                        ? 'bg-emerald-500 shadow-glow-green'
                        : 'bg-blue-500shadow-glow-blue'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Expanded Details */}
            {expandedTask === task.id && (
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 mb-1">Task ID</div>
                    <code className="text-xs bg-gray-800 px-2 py-1 rounded">{task.id}</code>
                  </div>
                  
                  <div>
                    <div className="text-gray-400 mb-1">Agent Model</div>
                    <div className="text-gray-300">Gemini 3 Pro</div>
                  </div>
                  
                  {task.startedAt && (
                    <div>
                      <div className="text-gray-400 mb-1">Started</div>
                      <div className="text-gray-300">
                        {new Date(task.startedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                  
                  {task.completedAt && (
                    <div>
                      <div className="text-gray-400 mb-1">Completed</div>
                      <div className="text-gray-300">
                        {new Date(task.completedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
                
                {task.status === 'failed' && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-800/30 rounded">
                    <div className="flex items-center text-red-400 mb-2">
                      <AlertCircle size={14} className="mr-2" />
                      <span className="font-medium">Error Details</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Gemini API rate limit exceeded. Retrying with exponential backoff.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
            <ListTodo size={24} className="text-gray-500" />
          </div>
          <p>No tasks in queue. Start a project to generate tasks.</p>
        </div>
      )}
    </div>
  )
}

// Example data
export const exampleTasks: Task[] = [
  {
    id: 'task-1',
    agent: 'Researcher',
    description: 'Research Gemini API capabilities for autonomous agents',
    status: 'completed',
    priority: 'high',
    estimatedTime: 30,
    progress: 100,
    startedAt: '2024-01-07T10:00:00Z',
    completedAt: '2024-01-07T10:25:00Z'
  },
  {
    id: 'task-2',
    agent: 'Architect',
    description: 'Design multi-agent system architecture',
    status: 'running',
    priority: 'high',
    estimatedTime: 45,
    progress: 65,
    startedAt: '2024-01-07T10:30:00Z'
  },
  {
    id: 'task-3',
    agent: 'Builder',
    description: 'Generate code for agent orchestration',
    status: 'pending',
    priority: 'medium',
    estimatedTime: 60,
    progress: 0
  },
  {
    id: 'task-4',
    agent: 'Reviewer',
    description: 'Validate generated code against requirements',
    status: 'pending',
    priority: 'medium',
    estimatedTime: 25,
    progress: 0
  },
  {
    id: 'task-5',
    agent: 'Optimizer',
    description: 'Optimize agent performance and cost',
    status: 'failed',
    priority: 'low',
    estimatedTime: 35,
    progress: 40,
    startedAt: '2024-01-07T09:15:00Z'
  }
]