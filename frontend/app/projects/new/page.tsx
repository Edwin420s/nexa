'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Check } from 'lucide-react'

const agentTypes = [
  { id: 'researcher', name: 'Researcher', description: 'Research topics and gather information', icon: '🔍' },
  { id: 'architect', name: 'Architect', description: 'Design system architecture', icon: '🏗️' },
  { id: 'builder', name: 'Builder', description: 'Generate code and build components', icon: '👷' },
  { id: 'reviewer', name: 'Reviewer', description: 'Review and validate outputs', icon: '👀' },
  { id: 'optimizer', name: 'Optimizer', description: 'Optimize performance and efficiency', icon: '⚡' },
]

const geminiModels = [
  { id: 'gemini-3-pro', name: 'Gemini 3 Pro', description: 'Most capable model for complex reasoning', maxTokens: 8192 },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fast and efficient for most tasks', maxTokens: 8192 },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Best for coding and complex tasks', maxTokens: 8192 },
]

export default function NewProjectPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    goal: '',
    selectedAgents: ['researcher', 'builder'],
    model: 'gemini-3-pro',
    constraints: {
      cost: 'medium',
      speed: 'high',
      quality: 'high'
    }
  })
  const [isCreating, setIsCreating] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAgentToggle = (agentId: string) => {
    setProjectData(prev => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agentId)
        ? prev.selectedAgents.filter(id => id !== agentId)
        : [...prev.selectedAgents, agentId]
    }))
  }

  const handleCreateProject = async () => {
    setIsCreating(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsCreating(false)
    router.push('/projects/1') // Redirect to project page
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center mb-6">
            {[1, 2, 3, 4].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= stepNumber ? 'bg-blue-600 border-2 border-blue-500 shadow-glow-blue' : 'bg-gray-800'}`}>
                  {step > stepNumber ? (
                    <Check size={16} className="text-white" />
                  ) : (
                    <span className={`${step >= stepNumber ? 'text-white' : 'text-gray-400'}`}>
                      {stepNumber}
                    </span>
                  )}
                </div>
                {stepNumber < 4 && (
                  <div className={`w-12 h-1 ${step > stepNumber ? 'bg-blue-600 border-2 border-blue-500 shadow-glow-blue' : 'bg-gray-800'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm text-gray-400">
            <span className={step >= 1 ? 'text-blue-400' : ''}>Basic Info</span>
            <span className={step >= 2 ? 'text-blue-400' : ''}>Goal</span>
            <span className={step >= 3 ? 'text-blue-400' : ''}>Agents</span>
            <span className={step >= 4 ? 'text-blue-400' : ''}>Review</span>
          </div>
        </div>

        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Project Information</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Project Title</label>
                <input
                  type="text"
                  value={projectData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g., Autonomous Research Agent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={projectData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full h-32 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Brief description of your project..."
                />
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={() => setStep(2)}
                disabled={!projectData.title}
                className={`px-6 py-3 rounded-lg font-medium ${projectData.title ? 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg' : 'bg-gray-800 cursor-not-allowed'}`}
              >
                Next: Define Goal
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Project Goal */}
        {step === 2 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Project Goal</h2>
            <div>
              <label className="block text-sm font-medium mb-2">What do you want to build?</label>
              <textarea
                value={projectData.goal}
                onChange={(e) => handleInputChange('goal', e.target.value)}
                className="w-full h-48 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                placeholder="Describe in detail what you want to build. The more specific, the better the agents can work...
                
Example: Build an autonomous research agent that can:
1. Research topics using web search
2. Summarize findings
3. Generate code snippets
4. Create documentation"
              />
              <p className="mt-2 text-sm text-gray-400">
                Be specific about requirements, technologies, and desired outcomes.
              </p>
            </div>
            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!projectData.goal}
                className={`px-6 py-3 rounded-lg font-medium ${projectData.goal ? 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg' : 'bg-gray-800 cursor-not-allowed'}`}
              >
                Next: Select Agents
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Agent Selection */}
        {step === 3 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Select AI Agents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {agentTypes.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentToggle(agent.id)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${projectData.selectedAgents.includes(agent.id) ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{agent.icon}</span>
                    {projectData.selectedAgents.includes(agent.id) && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{agent.name}</h3>
                  <p className="text-sm text-gray-400">{agent.description}</p>
                </div>
              ))}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-4">Select Gemini Model</label>
              <div className="space-y-3">
                {geminiModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => handleInputChange('model', model.id)}
                    className={`p-4 border rounded-lg cursor-pointer ${projectData.model === model.id ? 'border-purple-500 bg-purple-500/10' : 'border-gray-800 hover:border-gray-700'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{model.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{model.description}</p>
                      </div>
                      {projectData.model === model.id && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={projectData.selectedAgents.length === 0}
                className={`px-6 py-3 rounded-lg font-medium ${projectData.selectedAgents.length > 0 ? 'bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg' : 'bg-gray-800 cursor-not-allowed'}`}
              >
                Next: Review
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6">Review & Create</h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Project Name</h3>
                    <p className="text-lg">{projectData.title}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Description</h3>
                    <p className="text-gray-300">{projectData.description}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Selected Agents</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {projectData.selectedAgents.map(agentId => {
                        const agent = agentTypes.find(a => a.id === agentId)
                        return agent ? (
                          <span key={agent.id} className="px-3 py-1 bg-gray-800 rounded-full text-sm">
                            {agent.icon} {agent.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">Gemini Model</h3>
                    <p className="text-lg">
                      {geminiModels.find(m => m.id === projectData.model)?.name}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Project Goal</h3>
                <div className="p-4 bg-gray-900 rounded-lg">
                  <p className="whitespace-pre-line text-gray-300">{projectData.goal}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreateProject}
                disabled={isCreating}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green rounded-lg font-medium transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isCreating ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating Project...</span>
                  </span>
                ) : (
                  'Create & Launch Project'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}