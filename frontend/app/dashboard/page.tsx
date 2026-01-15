import ProjectCard from '@/components/ProjectCard'
import AnalyticsChart, { sampleAnalyticsData } from '@/components/AnalyticsChart'
import { TrendingUp, Users, Folder, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const projects = [
    {
      id: '1',
      title: 'Autonomous Research Agent',
      description: 'A multi-agent system for automated research using Gemini API',
      status: 'running' as const,
      createdAt: '2024-01-07T10:00:00Z',
      updatedAt: '2024-01-07T12:30:00Z',
      confidence: 0.85,
      agentsCount: 4
    },
    {
      id: '2',
      title: 'Code Generation Pipeline',
      description: 'Automated code generation for web applications',
      status: 'completed' as const,
      createdAt: '2024-01-06T14:00:00Z',
      updatedAt: '2024-01-07T09:15:00Z',
      confidence: 0.92,
      agentsCount: 3
    },
    {
      id: '3',
      title: 'Documentation Generator',
      description: 'AI-powered technical documentation creation',
      status: 'paused' as const,
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-06T16:45:00Z',
      confidence: 0.78,
      agentsCount: 2
    }
  ]

  const stats = [
    { label: 'Active Projects', value: '8', icon: Folder, change: '+12%', color: 'text-blue-400' },
    { label: 'Total Agents', value: '24', icon: Users, change: '+24%', color: 'text-purple-400' },
    { label: 'Avg Confidence', value: '84%', icon: BarChart3, change: '+5%', color: 'text-green-400' },
    { label: 'Success Rate', value: '92%', icon: TrendingUp, change: '+3%', color: 'text-yellow-400' }
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-400">Monitor your autonomous agents and projects</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg bg-gray-800`}>
                    <Icon className={stat.color} size={24} />
                  </div>
                  <span className="text-sm text-green-400 font-medium">{stat.change}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            )
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Analytics Chart */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Weekly Performance</h2>
            <AnalyticsChart 
              type="line" 
              data={sampleAnalyticsData}
              lines={['confidence', 'projects', 'agents']}
            />
          </div>

          {/* Recent Projects */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Projects</h2>
              <Link 
                href="/projects/new" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 border-2 border-blue-500 hover:border-blue-400 shadow-glow-blue hover:shadow-glow-blue-lg rounded-lg font-medium transition-all transform hover:scale-105"
              >
                New Project
              </Link>
            </div>
            
            <div className="space-y-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}