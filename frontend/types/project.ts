export interface Project {
  id: string
  title: string
  description: string
  status: 'running' | 'completed' | 'paused' | 'failed'
  createdAt: string
  updatedAt: string
  confidence: number
  agentsCount: number
  tags?: string[]
  metrics?: {
    tokensUsed: number
    apiCalls: number
    successRate: number
  }
}

export type ProjectStatus = Project['status']
