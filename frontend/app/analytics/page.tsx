'use client'

import { useState } from 'react'
import AnalyticsChart, { sampleAnalyticsData } from '@/components/AnalyticsChart'
import { TrendingUp, Users, Clock, BarChart3, Calendar, Download, Filter } from 'lucide-react'

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [activeMetric, setActiveMetric] = useState('all')

  const metrics = [
    { id: 'confidence', label: 'Confidence Score', value: '84.3%', change: '+2.1%', color: 'bg-blue-500' },
    { id: 'projects', label: 'Projects Created', value: '42', change: '+12%', color: 'bg-purple-500' },
    { id: 'agents', label: 'Agents Running', value: '156', change: '+24%', color: 'bg-green-500' },
    { id: 'runtime', label: 'Avg Runtime', value: '2h 18m', change: '-5%', color: 'bg-yellow-500' },
    { id: 'success', label: 'Success Rate', value: '92.5%', change: '+1.3%', color: 'bg-emerald-500' },
    { id: 'cost', label: 'Avg Cost', value: '$4.21', change: '-8%', color: 'bg-red-500' }
  ]

  const projectData = [
    { name: 'Autonomous Research', confidence: 88, agents: 4, tasks: 12, duration: '4h 22m' },
    { name: 'Code Generator', confidence: 92, agents: 3, tasks: 8, duration: '2h 45m' },
    { name: 'Doc Creator', confidence: 78, agents: 2, tasks: 6, duration: '1h 30m' },
    { name: 'Data Pipeline', confidence: 85, agents: 5, tasks: 15, duration: '6h 10m' },
    { name: 'Chatbot Framework', confidence: 90, agents: 4, tasks: 10, duration: '3h 55m' }
  ]

  const agentData = [
    { name: 'Researcher', usage: 42, success: 92, avgConfidence: 86 },
    { name: 'Architect', usage: 35, success: 88, avgConfidence: 82 },
    { name: 'Builder', usage: 58, success: 95, avgConfidence: 90 },
    { name: 'Reviewer', usage: 28, success: 85, avgConfidence: 79 },
    { name: 'Optimizer', usage: 21, success: 90, avgConfidence: 84 }
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics</h1>
              <p className="text-gray-400">Monitor performance and usage metrics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-gray-400" />
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="day">Last 24 hours</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="quarter">Last 90 days</option>
                </select>
              </div>
              
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg hover:bg-gray-800 transition-colors">
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-3 h-3 rounded-full ${metric.color}`} />
                  <span className={`text-sm font-medium ${metric.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {metric.change}
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-gray-400">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Chart */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Performance Trends</h2>
              <div className="flex space-x-2">
                {['confidence', 'projects', 'agents'].map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setActiveMetric(metric)}
                    className={`px-3 py-1 text-sm rounded-lg capitalize ${activeMetric === metric ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}
                  >
                    {metric}
                  </button>
                ))}
              </div>
            </div>
            <AnalyticsChart 
              type="line" 
              data={sampleAnalyticsData}
              lines={['confidence', 'projects', 'agents']}
            />
          </div>

          {/* Agent Performance */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Agent Performance</h2>
            <AnalyticsChart 
              type="bar" 
              data={agentData}
              bars={['usage', 'success', 'avgConfidence']}
            />
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Project Performance</h2>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors">
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Project Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Confidence</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Agents</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Tasks</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Duration</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map((project, index) => (
                  <tr key={index} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="py-4 px-4">
                      <div className="font-medium">{project.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-700 h-2 rounded-full overflow-hidden mr-3">
                          <div 
                            className="h-full bg-blue-500shadow-glow-blue"
                            style={{ width: `${project.confidence}%` }}
                          />
                        </div>
                        <span className="font-medium">{project.confidence}%</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Users size={16} className="mr-2 text-gray-400" />
                        {project.agents}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <BarChart3 size={16} className="mr-2 text-gray-400" />
                        {project.tasks}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-2 text-gray-400" />
                        {project.duration}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.confidence >= 90 ? 'bg-green-500/20 text-green-400' :
                        project.confidence >= 80 ? 'bg-blue-500/20 text-blue-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {project.confidence >= 90 ? 'Excellent' :
                         project.confidence >= 80 ? 'Good' : 'Fair'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Insights */}
        <div className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-900/10 border border-blue-800/30 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center mr-3">
                <TrendingUp className="text-blue-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold">Peak Usage</h3>
            </div>
            <p className="text-gray-300 mb-4">Tuesdays between 2-4 PM show 42% higher agent activity</p>
            <div className="text-sm text-blue-400">→ Optimize scheduling</div>
          </div>
          
          <div className="bg-purple-900/10 border border-purple-800/30 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mr-3">
                <BarChart3 className="text-purple-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold">Best Performance</h3>
            </div>
            <p className="text-gray-300 mb-4">Builder agents achieve 95% success rate on code generation</p>
            <div className="text-sm text-purple-400">→ Leverage for complex tasks</div>
          </div>
          
          <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center mr-3">
                <Users className="text-green-400" size={20} />
              </div>
              <h3 className="text-lg font-semibold">Agent Efficiency</h3>
            </div>
            <p className="text-gray-300 mb-4">Multi-agent teams complete projects 3x faster than single agents</p>
            <div className="text-sm text-green-400">→ Use team workflows</div>
          </div>
        </div>
      </div>
    </div>
  )
}