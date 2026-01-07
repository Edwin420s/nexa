// API utility functions for frontend-backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        error: data.message || 'An error occurred',
        status: response.status,
      }
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Network error',
      status: 500,
    }
  }
}

// Project APIs
export const projectApi = {
  // Get all projects
  getProjects: () => fetchApi<{ projects: any[] }>('/projects'),
  
  // Get single project
  getProject: (id: string) => fetchApi<{ project: any }>(`/projects/${id}`),
  
  // Create project
  createProject: (data: {
    title: string
    description: string
    goal: string
    agents: string[]
    model: string
  }) => fetchApi<{ projectId: string }>('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Start project execution
  startProject: (id: string) => fetchApi(`/projects/${id}/start`, {
    method: 'POST',
  }),
  
  // Pause project
  pauseProject: (id: string) => fetchApi(`/projects/${id}/pause`, {
    method: 'POST',
  }),
  
  // Delete project
  deleteProject: (id: string) => fetchApi(`/projects/${id}`, {
    method: 'DELETE',
  }),
  
  // Get project files
  getProjectFiles: (id: string) => fetchApi<{ files: any[] }>(`/projects/${id}/files`),
  
  // Download project
  downloadProject: (id: string) => fetchApi(`/projects/${id}/download`),
}

// Analytics APIs
export const analyticsApi = {
  // Get usage analytics
  getUsage: (timeRange: string = 'week') => 
    fetchApi<{ metrics: any[] }>(`/analytics/usage?range=${timeRange}`),
  
  // Get agent performance
  getAgentPerformance: () => 
    fetchApi<{ agents: any[] }>('/analytics/agents'),
  
  // Get project metrics
  getProjectMetrics: () => 
    fetchApi<{ projects: any[] }>('/analytics/projects'),
}

// Authentication APIs
export const authApi = {
  // Login
  login: (email: string, password: string) => 
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  // Register
  register: (data: {
    name: string
    email: string
    password: string
  }) => fetchApi<{ token: string; user: any }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Logout
  logout: () => fetchApi('/auth/logout', { method: 'POST' }),
  
  // Get current user
  getCurrentUser: () => fetchApi<{ user: any }>('/auth/me'),
}

// SSE Event Types
export interface SSEMessage {
  type: 'agent_update' | 'confidence_update' | 'file_generated' | 'project_completed' | 'error'
  data: any
  timestamp: string
}

// Create SSE connection
export function createSSEConnection(
  projectId: string,
  onMessage: (message: SSEMessage) => void,
  onError?: (error: Event) => void
) {
  const eventSource = new EventSource(`${API_BASE_URL}/projects/${projectId}/stream`)

  eventSource.onmessage = (event) => {
    try {
      const message: SSEMessage = JSON.parse(event.data)
      onMessage(message)
    } catch (error) {
      console.error('Failed to parse SSE message:', error)
    }
  }

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    onError?.(error)
  }

  return () => {
    eventSource.close()
  }
}

// Real-time confidence updates
export function subscribeToConfidenceUpdates(
  projectId: string,
  onConfidenceUpdate: (confidence: number) => void
) {
  return createSSEConnection(projectId, (message) => {
    if (message.type === 'confidence_update') {
      onConfidenceUpdate(message.data.confidence)
    }
  })
}

// Real-time agent updates
export function subscribeToAgentUpdates(
  projectId: string,
  onAgentUpdate: (agent: string, status: string, output: string) => void
) {
  return createSSEConnection(projectId, (message) => {
    if (message.type === 'agent_update') {
      onAgentUpdate(
        message.data.agent,
        message.data.status,
        message.data.output
      )
    }
  })
}

// File upload utility
export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Upload failed')
  }

  return response.json()
}

// Export data
export async function exportData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
  const response = await fetch(`${API_BASE_URL}/export?format=${format}`)
  
  if (!response.ok) {
    throw new Error('Export failed')
  }

  return response.blob()
}