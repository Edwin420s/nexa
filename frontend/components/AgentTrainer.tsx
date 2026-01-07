'use client'

import { useState, useEffect } from 'react'
import { Brain, Upload, Download, Play, Pause, Settings, BarChart3, Target, Zap, Cpu, Database } from 'lucide-react'

interface TrainingDataset {
  id: string
  name: string
  size: number
  quality: number
  examples: number
  lastUpdated: string
  categories: string[]
}

interface TrainingRun {
  id: string
  name: string
  dataset: string
  model: string
  status: 'pending' | 'training' | 'evaluating' | 'completed' | 'failed'
  progress: number
  accuracy: number
  loss: number
  epochs: number
  currentEpoch: number
  startedAt: string
  estimatedCompletion: string
}

interface AgentTrainerProps {
  agentId?: string
  onTrainComplete?: (modelId: string) => void
}

export default function AgentTrainer({ agentId, onTrainComplete }: AgentTrainerProps) {
  const [activeTab, setActiveTab] = useState<'datasets' | 'training' | 'models'>('datasets')
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
  const [trainingConfig, setTrainingConfig] = useState({
    model: 'gemini-2.5-flash',
    epochs: 10,
    batchSize: 32,
    learningRate: 0.001,
    validationSplit: 0.2
  })

  const datasets: TrainingDataset[] = [
    {
      id: 'dataset-1',
      name: 'Research Agent Examples',
      size: 2450000,
      quality: 0.92,
      examples: 12500,
      lastUpdated: '2024-01-07T10:00:00Z',
      categories: ['research', 'summarization', 'analysis']
    },
    {
      id: 'dataset-2',
      name: 'Code Generation Patterns',
      size: 3800000,
      quality: 0.88,
      examples: 21500,
      lastUpdated: '2024-01-06T14:30:00Z',
      categories: ['code', 'syntax', 'patterns']
    },
    {
      id: 'dataset-3',
      name: 'Architectural Decisions',
      size: 1200000,
      quality: 0.95,
      examples: 8500,
      lastUpdated: '2024-01-05T09:15:00Z',
      categories: ['architecture', 'design', 'patterns']
    },
    {
      id: 'dataset-4',
      name: 'Error Recovery Scenarios',
      size: 1800000,
      quality: 0.85,
      examples: 9500,
      lastUpdated: '2024-01-04T16:45:00Z',
      categories: ['errors', 'recovery', 'debugging']
    }
  ]

  const [trainingRuns, setTrainingRuns] = useState<TrainingRun[]>([
    {
      id: 'run-1',
      name: 'Research Agent v2',
      dataset: 'Research Agent Examples',
      model: 'gemini-2.5-flash',
      status: 'training',
      progress: 65,
      accuracy: 0.78,
      loss: 0.42,
      epochs: 10,
      currentEpoch: 6,
      startedAt: '2024-01-07T09:00:00Z',
      estimatedCompletion: '2024-01-07T14:30:00Z'
    },
    {
      id: 'run-2',
      name: 'Code Generator Fine-tune',
      dataset: 'Code Generation Patterns',
      model: 'gemini-3-pro',
      status: 'completed',
      progress: 100,
      accuracy: 0.92,
      loss: 0.18,
      epochs: 15,
      currentEpoch: 15,
      startedAt: '2024-01-06T10:00:00Z',
      estimatedCompletion: '2024-01-06T18:00:00Z'
    },
    {
      id: 'run-3',
      name: 'Architect Agent Training',
      dataset: 'Architectural Decisions',
      model: 'gemini-2.5-pro',
      status: 'failed',
      progress: 42,
      accuracy: 0.65,
      loss: 0.85,
      epochs: 8,
      currentEpoch: 3,
      startedAt: '2024-01-05T14:00:00Z',
      estimatedCompletion: '2024-01-05T20:00:00Z'
    }
  ])

  const [isTraining, setIsTraining] = useState(false)

  // Simulate training progress
  useEffect(() => {
    if (!isTraining) return

    const interval = setInterval(() => {
      setTrainingRuns(prev => prev.map(run => {
        if (run.status === 'training' && run.progress < 100) {
          const newProgress = Math.min(run.progress + 2, 100)
          const newAccuracy = run.accuracy + 0.01
          const newLoss = Math.max(run.loss - 0.02, 0.1)
          const newCurrentEpoch = Math.min(run.currentEpoch + 1, run.epochs)
          
          const updatedRun = {
            ...run,
            progress: newProgress,
            accuracy: parseFloat(newAccuracy.toFixed(2)),
            loss: parseFloat(newLoss.toFixed(2)),
            currentEpoch: newCurrentEpoch
          }

          if (newProgress === 100) {
            updatedRun.status = 'completed'
            onTrainComplete?.(run.id)
          }

          return updatedRun
        }
        return run
      }))
    }, 2000)

    return () => clearInterval(interval)
  }, [isTraining, onTrainComplete])

  const startTraining = () => {
    if (!selectedDataset) return

    const newRun: TrainingRun = {
      id: `run-${Date.now()}`,
      name: `Training ${datasets.find(d => d.id === selectedDataset)?.name}`,
      dataset: datasets.find(d => d.id === selectedDataset)!.name,
      model: trainingConfig.model,
      status: 'training',
      progress: 0,
      accuracy: 0.5,
      loss: 1.0,
      epochs: trainingConfig.epochs,
      currentEpoch: 0,
      startedAt: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 3600000).toISOString() // 1 hour
    }

    setTrainingRuns(prev => [newRun, ...prev])
    setIsTraining(true)
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return mb > 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(1)} MB`
  }

  const getStatusColor = (status: TrainingRun['status']) => {
    switch (status) {
      case 'training': return 'text-blue-400 bg-blue-400/10'
      case 'completed': return 'text-green-400 bg-green-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <Brain className="text-blue-400" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Agent Trainer</h3>
            <p className="text-sm text-gray-400">Fine-tune and optimize agent behavior</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Upload size={18} />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Download size={18} />
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 mb-6">
        <button
          onClick={() => setActiveTab('datasets')}
          className={`px-4 py-3 font-medium ${activeTab === 'datasets' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Datasets
        </button>
        <button
          onClick={() => setActiveTab('training')}
          className={`px-4 py-3 font-medium ${activeTab === 'training' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Training Runs
        </button>
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-3 font-medium ${activeTab === 'models' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        >
          Models
        </button>
      </div>

      {/* Datasets Tab */}
      {activeTab === 'datasets' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                onClick={() => setSelectedDataset(dataset.id)}
                className={`border rounded-xl p-5 cursor-pointer transition-all ${selectedDataset === dataset.id ? 'border-blue-500 bg-blue-500/5' : 'border-gray-800 hover:border-gray-700'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold mb-1">{dataset.name}</h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>{formatFileSize(dataset.size)}</span>
                      <span>{dataset.examples.toLocaleString()} examples</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400">
                      {(dataset.quality * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">Quality</div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {dataset.categories.map((category, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded">
                      {category}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500">
                  Updated: {new Date(dataset.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Training Configuration */}
          <div className="border border-gray-800 rounded-xl p-6">
            <h4 className="font-medium mb-6">Training Configuration</h4>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Base Model</label>
                <select
                  value={trainingConfig.model}
                  onChange={(e) => setTrainingConfig(prev => ({ ...prev, model: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  <option value="gemini-3-pro">Gemini 3 Pro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Epochs</label>
                <input
                  type="number"
                  value={trainingConfig.epochs}
                  onChange={(e) => setTrainingConfig(prev => ({ ...prev, epochs: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                  min="1"
                  max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Batch Size</label>
                <input
                  type="number"
                  value={trainingConfig.batchSize}
                  onChange={(e) => setTrainingConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                  min="1"
                  max="128"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Learning Rate</label>
                <input
                  type="number"
                  step="0.0001"
                  value={trainingConfig.learningRate}
                  onChange={(e) => setTrainingConfig(prev => ({ ...prev, learningRate: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500"
                  min="0.0001"
                  max="0.01"
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={startTraining}
                disabled={!selectedDataset || isTraining}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play size={18} />
                <span>Start Training</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Runs Tab */}
      {activeTab === 'training' && (
        <div className="space-y-4">
          {trainingRuns.map((run) => (
            <div key={run.id} className="border border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-semibold">{run.name}</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(run.status)}`}>
                      {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Dataset</div>
                      <div className="font-medium">{run.dataset}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Model</div>
                      <div className="font-medium">{run.model}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Started</div>
                      <div className="font-medium">
                        {new Date(run.startedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400">Epochs</div>
                      <div className="font-medium">
                        {run.currentEpoch}/{run.epochs}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold mb-1">{run.progress}%</div>
                  <div className="text-sm text-gray-400">Progress</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">Training Progress</span>
                  <span className="font-medium">{run.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      run.status === 'completed' 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : run.status === 'failed'
                        ? 'bg-gradient-to-r from-red-500 to-orange-500'
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${run.progress}%` }}
                  />
                </div>
              </div>
              
              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">
                    {(run.accuracy * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-400">
                    {run.loss.toFixed(3)}
                  </div>
                  <div className="text-sm text-gray-400">Loss</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-400">
                    {run.currentEpoch}
                  </div>
                  <div className="text-sm text-gray-400">Current Epoch</div>
                </div>
              </div>
            </div>
          ))}
          
          {trainingRuns.length === 0 && (
            <div className="text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No training runs yet. Start training to see progress.</p>
            </div>
          )}
        </div>
      )}

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Research Agent v2',
                baseModel: 'gemini-2.5-flash',
                accuracy: 0.92,
                size: '2.4B',
                trainingExamples: 12500,
                lastUsed: '2 hours ago',
                status: 'active'
              },
              {
                name: 'Code Generator Pro',
                baseModel: 'gemini-3-pro',
                accuracy: 0.88,
                size: '3.1B',
                trainingExamples: 21500,
                lastUsed: '1 day ago',
                status: 'active'
              },
              {
                name: 'Architect Assistant',
                baseModel: 'gemini-2.5-pro',
                accuracy: 0.95,
                size: '2.8B',
                trainingExamples: 8500,
                lastUsed: '3 days ago',
                status: 'inactive'
              },
              {
                name: 'Error Handler',
                baseModel: 'gemini-2.5-flash',
                accuracy: 0.85,
                size: '1.9B',
                trainingExamples: 9500,
                lastUsed: '1 week ago',
                status: 'active'
              }
            ].map((model, idx) => (
              <div key={idx} className="border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold mb-1">{model.name}</h4>
                    <div className="text-sm text-gray-400">Based on {model.baseModel}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    model.status === 'active' 
                      ? 'text-green-400 bg-green-400/10'
                      : 'text-gray-400 bg-gray-400/10'
                  }`}>
                    {model.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {(model.accuracy * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-400">Accuracy</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{model.size}</div>
                    <div className="text-sm text-gray-400">Size</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>{model.trainingExamples.toLocaleString()} examples</span>
                  <span>Used {model.lastUsed}</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Model Performance */}
          <div className="border border-gray-800 rounded-xl p-6">
            <h4 className="font-medium mb-6">Model Performance Comparison</h4>
            <div className="space-y-4">
              {[
                { model: 'Research Agent v2', accuracy: 92, speed: 85, cost: 78 },
                { model: 'Code Generator Pro', accuracy: 88, speed: 72, cost: 65 },
                { model: 'Architect Assistant', accuracy: 95, speed: 68, cost: 82 },
                { model: 'Base Gemini 2.5 Flash', accuracy: 82, speed: 95, cost: 45 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center space-x-4">
                  <div className="w-32 text-sm font-medium">{item.model}</div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400">{item.accuracy}%</div>
                        <div className="text-xs text-gray-400">Accuracy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-400">{item.speed}%</div>
                        <div className="text-xs text-gray-400">Speed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-400">{item.cost}%</div>
                        <div className="text-xs text-gray-400">Cost Eff.</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}