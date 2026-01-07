export interface Agent {
  id: string
  name: string
  type: 'researcher' | 'architect' | 'builder' | 'reviewer' | 'optimizer'
  status: 'idle' | 'running' | 'completed' | 'failed'
  confidence: number
  currentTask?: string
  progress: number
  model: string
  lastUpdated: string
}

export type AgentType = Agent['type']
export type AgentStatus = Agent['status']
