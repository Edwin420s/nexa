'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AgentOutput from '@/components/AgentOutput'
import ConfidenceBar from '@/components/ConfidenceBar'
import FileExplorer, { sampleFiles } from '@/components/FileExplorer'
import SSEStream from '@/components/SSEStream'
import { Play, Pause, Download, RefreshCw, Settings, Share2, BarChart3, Clock, Users, Folder } from 'lucide-react'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string
  
  const [project, setProject] = useState({
    id: projectId,
    title: 'Autonomous Research Agent',
    description: 'Multi-agent system for automated research using Gemini API',
    status: 'running',
    confidence: 0.85,
    createdAt: '2024-01-07T10:00:00Z',
    updatedAt: new Date().toISOString(),
    agentsCount: 4,
    totalTasks: 12,
    completedTasks: 8,
    selectedModels: ['Gemini 3 Pro', 'Gemini 2.5 Flash'],
    constraints: {
      cost: 'medium',
      speed: 'high',
      quality: 'high'
    }
  })

  const [isRunning, setIsRunning] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  const stats = [
    { label: 'Confidence Score', value: `${(project.confidence * 100).toFixed(1)}%`, icon: BarChart3, color: 'text-blue-400' },
    { label: 'Agents Running', value: project.agentsCount.toString(), icon: Users, color: 'text-purple-400' },
    { label: 'Tasks Completed', value: `${project.completedTasks}/${project.totalTasks}`, icon: Clock, color: 'text-green-400' },
    { label: 'Running Time', value: '4h 22m', icon: Clock, color: 'text-yellow-400' },
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      {/* SSE Stream Component */}
      <SSEStream projectId={projectId} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${project.status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {project.status === 'running' ? '▶ Live' : '⏸ Paused'}
                </span>
              </div>
              <p className="text-gray-400">{project.description}</p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium ${isRunning ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
                <span>{isRunning ? 'Pause' : 'Resume'}</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                <RefreshCw size={18} />
                <span>Restart</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`${stat.color} opacity-80`} size={20} />
                    <span className="text-xs text-gray-400">{stat.label}</span>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </div>
              )
            })}
          </div>

          {/* Confidence Bar */}
          <div className="mb-6">
            <ConfidenceBar confidence={project.confidence} size="lg" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-8">
          {['overview', 'agents', 'files', 'analytics', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium capitalize transition-colors ${activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Agent Output */}
          <div className="lg:col-span-2 space-y-8">
            <AgentOutput projectId={projectId} />
            
            {/* Project Details */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-semibold mb-4">Project Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Models Used</h4>
                  <div className="space-y-2">
                    {project.selectedModels.map((model, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-gray-300">{model}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Constraints</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Cost</span>
                      <span className="capitalize">{project.constraints.cost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Speed</span>
                      <span className="capitalize">{project.constraints.speed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Quality</span>
                      <span className="capitalize">{project.constraints.quality}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            <FileExplorer files={sampleFiles} />
            
            {/* Agent Status */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Agent Status</h3>
              <div className="space-y-4">
                {[
                  { name: 'Researcher', status: 'running', confidence: 0.88 },
                  { name: 'Architect', status: 'running', confidence: 0.92 },
                  { name: 'Builder', status: 'running', confidence: 0.78 },
                  { name: 'Reviewer', status: 'waiting', confidence: 0.65 }
                ].map((agent, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{(agent.confidence * 100).toFixed(0)}%</div>
                      <div className="text-xs text-gray-400 capitalize">{agent.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors">
                  <Share2 size={18} />
                  <span>Share Project</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors">
                  <Settings size={18} />
                  <span>Configure Agents</span>
                </button>
                <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-colors">
                  <Download size={18} />
                  <span>Export All Files</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}