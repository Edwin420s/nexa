'use client'

import { useEffect, useState } from 'react'

interface SSEEvent {
  type: 'agent_update' | 'confidence_update' | 'project_complete'
  data: any
  timestamp: string
}

interface SSEStreamProps {
  projectId: string
  onEvent?: (event: SSEEvent) => void
}

export default function SSEStream({ projectId, onEvent }: SSEStreamProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [events, setEvents] = useState<SSEEvent[]>([])

  useEffect(() => {
    const connectSSE = () => {
      const eventSource = new EventSource(`/api/projects/${projectId}/stream`)

      eventSource.onopen = () => {
        console.log('SSE connection opened')
        setIsConnected(true)
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          const sseEvent: SSEEvent = {
            type: data.type,
            data: data.data,
            timestamp: new Date().toISOString()
          }
          
          setEvents(prev => [sseEvent, ...prev].slice(0, 50))
          onEvent?.(sseEvent)
        } catch (error) {
          console.error('Error parsing SSE event:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('SSE error:', error)
        setIsConnected(false)
        eventSource.close()
        
        // Reconnect after 5 seconds
        setTimeout(connectSSE, 5000)
      }

      return eventSource
    }

    const eventSource = connectSSE()

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [projectId, onEvent])

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">
            {isConnected ? 'Live Stream Connected' : 'Connecting...'}
          </span>
        </div>
        <div className="text-xs text-gray-400">
          {events.length} events received
        </div>
      </div>
    </div>
  )
}