import { useState, useEffect, useCallback } from 'react'
import { Agent, AgentStatus } from '@/types/agent'
import { projectApi } from '@/lib/api'

export function useAgents(projectId?: string) {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchAgents = useCallback(async () => {
    if (!projectId) return
    
    try {
      setIsLoading(true)
      const response = await projectApi.getProject(projectId)
      if (response.error) {
        throw new Error(response.error)
      }
      // Assuming the project response includes an agents array
      if (response.data?.project?.agents) {
        setAgents(response.data.project.agents)
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agents'))
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  const updateAgent = useCallback(async (agentId: string, updates: Partial<Agent>) => {
    setAgents(prev => 
      prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updates } : agent
      )
    )
    
    try {
      // If you have an API endpoint to update agent status
      // await projectApi.updateAgent(projectId, agentId, updates)
    } catch (err) {
      console.error('Failed to update agent:', err)
      // Revert on error
      fetchAgents()
    }
  }, [fetchAgents])

  const startAgent = useCallback(async (agentId: string) => {
    return updateAgent(agentId, { status: 'running' })
  }, [updateAgent])

  const stopAgent = useCallback(async (agentId: string) => {
    return updateAgent(agentId, { status: 'idle' })
  }, [updateAgent])

  const restartAgent = useCallback(async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId)
    if (!agent) return
    
    await updateAgent(agentId, { 
      status: 'running',
      progress: 0,
      currentTask: 'Restarting...'
    })
  }, [agents, updateAgent])

  // Initial fetch
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  return {
    agents,
    isLoading,
    error,
    fetchAgents,
    updateAgent,
    startAgent,
    stopAgent,
    restartAgent,
  }
}

// Hook for a single agent
export function useAgent(projectId?: string, agentId?: string) {
  const { agents, ...rest } = useAgents(projectId)
  const agent = agents.find(a => a.id === agentId)
  
  return {
    agent,
    ...rest
  }
}
