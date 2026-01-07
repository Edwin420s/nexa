import ProjectCard from '@/components/ProjectCard'
import Link from 'next/link'
import { Search, Filter, Plus } from 'lucide-react'

export default function ProjectsPage() {
  const projects = [
    {
      id: '1',
      title: 'Autonomous Research Agent',
      description: 'Multi-agent system for automated research and documentation',
      status: 'running' as const,
      createdAt: '2024-01-07T10:00:00Z',
      updatedAt: '2024-01-07T12:30:00Z',
      confidence: 0.85,
      agentsCount: 4
    },
    {
      id: '2',
      title: 'Code Generation Pipeline',
      description: 'Automated full-stack web application code generation',
      status: 'completed' as const,
      createdAt: '2024-01-06T14:00:00Z',
      updatedAt: '2024-01-07T09:15:00Z',
      confidence: 0.92,
      agentsCount: 3
    },
    {
      id: '3',
      title: 'API Documentation Generator',
      description: 'AI-powered API documentation with examples',
      status: 'paused' as const,
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-06T16:45:00Z',
      confidence: 0.78,
      agentsCount: 2
    },
    {
      id: '4',
      title: 'Data Analysis Pipeline',
      description: 'Automated data processing and visualization',
      status: 'failed' as const,
      createdAt: '2024-01-04T11:00:00Z',
      updatedAt: '2024-01-05T14:20:00Z',
      confidence: 0.65,
      agentsCount: 3
    },
    {
      id: '5',
      title: 'Chatbot Framework',
      description: 'Modular chatbot system with Gemini integration',
      status: 'completed' as const,
      createdAt: '2024-01-03T13:00:00Z',
      updatedAt: '2024-01-04T10:30:00Z',
      confidence: 0.88,
      agentsCount: 5
    },
    {
      id: '6',
      title: 'Image Processing Pipeline',
      description: 'AI-powered image analysis and transformation',
      status: 'running' as const,
      createdAt: '2024-01-02T15:00:00Z',
      updatedAt: '2024-01-07T11:45:00Z',
      confidence: 0.91,
      agentsCount: 3
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Projects</h1>
              <p className="text-gray-400">Manage your autonomous AI projects</p>
            </div>
            <Link 
              href="/projects/new" 
              className="flex items-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              <span>New Project</span>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Search projects..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors">
              <Filter size={20} />
              <span>Filter</span>
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard key={project.id} {...project} />
          ))}
        </div>

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-full flex items-center justify-center">
              <Plus size={48} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">Create your first autonomous AI project</p>
            <Link 
              href="/projects/new" 
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-medium transition-all transform hover:scale-105"
            >
              <Plus size={20} />
              <span>Create Project</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}