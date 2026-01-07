import Link from 'next/link'
import { Calendar, Clock, BarChart3, Users } from 'lucide-react'
import ConfidenceBar from './ConfidenceBar'

interface ProjectCardProps {
  id: string
  title: string
  description: string
  status: 'running' | 'completed' | 'paused' | 'failed'
  createdAt: string
  updatedAt: string
  confidence: number
  agentsCount: number
}

export default function ProjectCard({
  id,
  title,
  description,
  status,
  createdAt,
  updatedAt,
  confidence,
  agentsCount
}: ProjectCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'paused': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return '▶️'
      case 'completed': return '✅'
      case 'paused': return '⏸️'
      case 'failed': return '❌'
      default: return '📄'
    }
  }

  return (
    <Link href={`/projects/${id}`}>
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 hover:bg-gray-900 transition-all duration-200 hover:scale-[1.02] cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-semibold group-hover:text-white transition-colors">
                {title}
              </h3>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor()}`}>
                {getStatusIcon()} {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <ConfidenceBar confidence={confidence} size="sm" />
          
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Users size={14} />
                <span>{agentsCount} agents</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={14} />
                <span>{new Date(createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1">
              <BarChart3 size={14} />
              <span>{(confidence * 100).toFixed(0)}%</span>
            </div>
          </div>

          {status === 'running' && (
            <div className="flex items-center space-x-2 text-sm">
              <Clock size={14} className="text-blue-400" />
              <span className="text-blue-400 animate-pulse">Live Updates Streaming</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}