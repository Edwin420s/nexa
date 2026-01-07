'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Project, ProjectStatus } from '@/types/project'
import { Agent } from '@/types/agent'
import { projectApi } from '@/lib/api'

interface ProjectFormProps {
  project?: Project
  onSuccess?: () => void
}

export default function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Partial<Project>>({
    title: '',
    description: '',
    status: 'paused',
    agents: [],
    config: {},
    ...project
  })
  
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Fetch available agents
    const fetchAgents = async () => {
      try {
        const response = await projectApi.getProject('current') // Adjust this based on your API
        if (response.data?.agents) {
          setAvailableAgents(response.data.agents)
        }
      } catch (err) {
        console.error('Failed to fetch agents:', err)
      }
    }
    
    fetchAgents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (project?.id) {
        // Update existing project
        await projectApi.updateProject(project.id, formData)
      } else {
        // Create new project
        const response = await projectApi.createProject({
          ...formData,
          status: 'paused' as ProjectStatus
        })
        
        if (response.error) {
          throw new Error(response.error)
        }
        
        if (response.data?.projectId) {
          if (onSuccess) {
            onSuccess()
          } else {
            router.push(`/projects/${response.data.projectId}`)
          }
          return
        }
      }
      
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/projects')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const toggleAgent = (agentId: string) => {
    setFormData(prev => ({
      ...prev,
      agents: prev.agents?.includes(agentId)
        ? prev.agents.filter(id => id !== agentId)
        : [...(prev.agents || []), agentId]
    }))
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Project Name
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Select Agents
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {availableAgents.map(agent => (
              <div 
                key={agent.id}
                onClick={() => toggleAgent(agent.id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  formData.agents?.includes(agent.id)
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    agent.status === 'running' ? 'bg-green-500' : 'bg-gray-600'
                  }`} />
                  <span className="font-medium">{agent.name}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">{agent.type}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {project ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{project ? 'Update Project' : 'Create Project'}</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
