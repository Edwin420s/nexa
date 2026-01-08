'use client'

import { useState, useEffect } from 'react'
<<<<<<< D:\Projects\New folder (2)\nexa\frontend\app\performance\page.tsx
import { Activity, Cpu, Zap, Database, Clock, DollarSign, TrendingUp, AlertCircle, BarChart3, Server } from 'lucide-react'
import AnalyticsChart from '@/components/AnalyticsChart'
=======
import { Activity, Cpu, Database, Clock, DollarSign, AlertCircle } from 'lucide-react'
import { PerformanceMetricsGrid } from '@/components/performance/PerformanceMetricsGrid'
import { RealTimeCharts } from '@/components/performance/RealTimeCharts'
import { AgentPerformanceList } from '@/components/performance/AgentPerformanceList'
import { AlertsSection } from '@/components/performance/AlertsSection'
import { PerformanceRecommendations } from '@/components/performance/PerformanceRecommendations'
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-2adb6d3b\frontend\app\performance\page.tsx

export default function PerformancePage() {
  const [timeRange, setTimeRange] = useState('hour')
  const [activeMetric, setActiveMetric] = useState('latency')
  const [realTimeData, setRealTimeData] = useState<any[]>([])

  // Generate real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      const newDataPoint = {
        timestamp: new Date().toISOString(),
        latency: 100 + Math.random() * 200,
        throughput: 500 + Math.random() * 1000,
        errorRate: Math.random() * 5,
        cost: 0.1 + Math.random() * 0.5,
        cpu: 30 + Math.random() * 50,
        memory: 40 + Math.random() * 40
      }
      
      setRealTimeData(prev => {
        const newData = [...prev, newDataPoint]
        return newData.slice(-60) // Keep last 60 data points
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const performanceMetrics = [
    {
      title: 'Average Latency',
      value: '142ms',
      change: '-12%',
      trend: 'down',
      icon: Clock,
      color: 'text-green-400',
      target: '< 200ms'
    },
    {
      title: 'Requests/Second',
      value: '1,248',
      change: '+24%',
      trend: 'up',
      icon: Activity,
      color: 'text-blue-400',
      target: '> 1000'
    },
    {
      title: 'Error Rate',
      value: '0.42%',
      change: '-18%',
      trend: 'down',
      icon: AlertCircle,
      color: 'text-red-400',
      target: '< 1%'
    },
    {
      title: 'Cost/Hour',
      value: '$4.28',
      change: '-8%',
      trend: 'down',
      icon: DollarSign,
      color: 'text-purple-400',
      target: '< $5'
    },
    {
      title: 'CPU Usage',
      value: '64%',
      change: '+5%',
      trend: 'up',
      icon: Cpu,
      color: 'text-yellow-400',
      target: '< 80%'
    },
    {
      title: 'Memory Usage',
      value: '3.2GB',
      change: '+12%',
      trend: 'up',
      icon: Database,
      color: 'text-pink-400',
      target: '< 4GB'
    }
  ]

  const agentPerformance = [
    {
      agent: 'Researcher',
      latency: '156ms',
      successRate: '98.2%',
      costPerTask: '$0.042',
      tokensPerTask: 1245,
      utilization: '85%'
    },
    {
      agent: 'Architect',
      latency: '210ms',
      successRate: '96.8%',
      costPerTask: '$0.058',
      tokensPerTask: 1890,
      utilization: '78%'
    },
    {
      agent: 'Builder',
      latency: '185ms',
      successRate: '97.5%',
      costPerTask: '$0.051',
      tokensPerTask: 1560,
      utilization: '92%'
    },
    {
      agent: 'Reviewer',
      latency: '134ms',
      successRate: '99.1%',
      costPerTask: '$0.035',
      tokensPerTask: 980,
      utilization: '68%'
    },
    {
      agent: 'Optimizer',
      latency: '178ms',
      successRate: '97.8%',
      costPerTask: '$0.048',
      tokensPerTask: 1420,
      utilization: '74%'
    }
  ]

  const alerts = [
    {
      id: 'alert-1',
      severity: 'high',
      title: 'API Latency Spike',
      description: 'Gemini API response time increased by 300%',
      time: '2 minutes ago',
      agent: 'Researcher'
    },
    {
      id: 'alert-2',
      severity: 'medium',
      title: 'Memory Usage High',
      description: 'Builder agent using 92% of allocated memory',
      time: '15 minutes ago',
      agent: 'Builder'
    },
    {
      id: 'alert-3',
      severity: 'low',
      title: 'Cost Increase Detected',
      description: 'Hourly cost increased by 18% due to high usage',
      time: '1 hour ago',
      agent: 'Optimizer'
    }
  ]

<<<<<<< D:\Projects\New folder (2)\nexa\frontend\app\performance\page.tsx
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }
=======
  const recommendations = [
    {
      area: 'Agent Scaling',
      recommendation: 'Add 2 more Builder agents',
      impact: 'Reduce latency by 45%',
      effort: 'Low',
      priority: 'High' as const
    },
    {
      area: 'Model Optimization',
      recommendation: 'Use Gemini 2.5 Flash for non-critical tasks',
      impact: 'Reduce costs by 28%',
      effort: 'Medium' as const,
      priority: 'Medium' as const
    },
    {
      area: 'Caching Strategy',
      recommendation: 'Implement response caching for common queries',
      impact: 'Improve throughput by 35%',
      effort: 'High' as const,
      priority: 'High' as const
    }
  ];
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-2adb6d3b\frontend\app\performance\page.tsx

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Performance Monitoring</h1>
              <p className="text-gray-400">Real-time monitoring and analytics for agent systems</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="hour">Last Hour</option>
                <option value="day">Last 24 Hours</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
              
              <div className="flex items-center space-x-2 text-green-400">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm">Live Data</span>
              </div>
            </div>
          </div>

<<<<<<< D:\Projects\New folder (2)\nexa\frontend\app\performance\page.tsx
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {performanceMetrics.map((metric, idx) => {
              const Icon = metric.icon
              return (
                <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gray-800`}>
                      <Icon className={metric.color} size={20} />
                    </div>
                    <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {metric.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.title}</div>
                  <div className="text-xs text-gray-500 mt-2">Target: {metric.target}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Real-time Charts */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Real-time Performance</h2>
                <p className="text-sm text-gray-400">Live metrics from agent operations</p>
              </div>
              <div className="flex space-x-2">
                {['latency', 'throughput', 'errorRate', 'cost'].map((metric) => (
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
            
            <div className="h-80">
              <AnalyticsChart 
                type="line" 
                data={realTimeData.map((d, i) => ({
                  name: `${i}s`,
                  [activeMetric]: d[activeMetric]
                }))}
                lines={[activeMetric]}
              />
            </div>
            
            <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-green-500 mr-2" />
                <span>Current: {realTimeData[realTimeData.length - 1]?.[activeMetric]?.toFixed(2) || '0'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-blue-500 mr-2" />
                <span>Average: {(realTimeData.reduce((acc, d) => acc + d[activeMetric], 0) / realTimeData.length || 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-red-500 mr-2" />
                <span>Peak: {Math.max(...realTimeData.map(d => d[activeMetric] || 0)).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Agent Performance */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Agent Performance</h2>
            
            <div className="space-y-4">
              {agentPerformance.map((agent, idx) => (
                <div key={idx} className="border border-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <span className="font-bold">{agent.agent.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{agent.agent}</div>
                        <div className="text-sm text-gray-400">
                          Utilization: <span className="text-gray-300">{agent.utilization}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-lg font-bold">{agent.successRate}</div>
                      <div className="text-xs text-gray-400">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-400">Latency</div>
                      <div className="font-medium">{agent.latency}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Cost/Task</div>
                      <div className="font-medium">{agent.costPerTask}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Tokens/Task</div>
                      <div className="font-medium">{agent.tokensPerTask.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts & Notifications */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Active Alerts</h2>
            <span className="text-sm text-gray-400">
              {alerts.filter(a => a.severity === 'high').length} critical
            </span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-xl p-5 ${getAlertColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold mb-1">{alert.title}</h3>
                    <div className="text-sm text-gray-300">{alert.description}</div>
                  </div>
                  <AlertCircle size={20} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-gray-400">Agent: </span>
                    <span className="font-medium">{alert.agent}</span>
                  </div>
                  <div className="text-sm text-gray-400">{alert.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Recommendations */}
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Performance Recommendations</h2>
              <p className="text-sm text-gray-400">AI-generated optimizations based on performance data</p>
            </div>
            <div className="flex items-center space-x-2 text-blue-400">
              <TrendingUp size={20} />
              <span>Estimated Improvement: 32%</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                area: 'Agent Scaling',
                recommendation: 'Add 2 more Builder agents',
                impact: 'Reduce latency by 45%',
                effort: 'Low',
                priority: 'High'
              },
              {
                area: 'Model Optimization',
                recommendation: 'Use Gemini 2.5 Flash for non-critical tasks',
                impact: 'Reduce costs by 28%',
                effort: 'Medium',
                priority: 'Medium'
              },
              {
                area: 'Caching Strategy',
                recommendation: 'Implement response caching for common queries',
                impact: 'Improve throughput by 35%',
                effort: 'High',
                priority: 'High'
              }
            ].map((rec, idx) => (
              <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-lg p-5">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold">{rec.area}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rec.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                    rec.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {rec.priority} Priority
                  </span>
                </div>
                
                <p className="text-gray-300 mb-4">{rec.recommendation}</p>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-400">Impact</div>
                    <div className="font-medium text-green-400">{rec.impact}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Effort</div>
                    <div className={`font-medium ${
                      rec.effort === 'Low' ? 'text-green-400' :
                      rec.effort === 'Medium' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {rec.effort}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Next Recommended Action</div>
                <div className="text-sm text-gray-400">Implement agent scaling to handle increased load</div>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-lg font-medium transition-colors">
                Apply Optimization
              </button>
            </div>
          </div>
        </div>
=======
          <PerformanceMetricsGrid metrics={performanceMetrics} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <RealTimeCharts 
            realTimeData={realTimeData} 
            activeMetric={activeMetric} 
            onMetricChange={setActiveMetric} 
          />

          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Agent Performance</h2>
            <AgentPerformanceList agents={agentPerformance} />
          </div>
        </div>

        <AlertsSection alerts={alerts} />
        <PerformanceRecommendations recommendations={recommendations} />
>>>>>>> c:\Users\edwin\.windsurf\worktrees\nexa\nexa-2adb6d3b\frontend\app\performance\page.tsx
      </div>
    </div>
  )
}