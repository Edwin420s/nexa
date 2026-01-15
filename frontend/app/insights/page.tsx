'use client'

import { useState } from 'react'
import { TrendingUp, Target, Zap, BarChart3, Clock, DollarSign, Cpu, Sparkles } from 'lucide-react'
import AnalyticsChart from '@/components/AnalyticsChart'
import ConfidenceHeatmap from '@/components/ConfidenceHeatmap'

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState('month')
  const [view, setView] = useState('overview')

  const performanceData = [
    { name: 'Week 1', accuracy: 78, speed: 65, cost: 85 },
    { name: 'Week 2', accuracy: 82, speed: 72, cost: 78 },
    { name: 'Week 3', accuracy: 85, speed: 78, cost: 72 },
    { name: 'Week 4', accuracy: 88, speed: 82, cost: 68 },
    { name: 'Week 5', accuracy: 90, speed: 85, cost: 65 },
    { name: 'Week 6', accuracy: 92, speed: 88, cost: 62 }
  ]

  const confidenceData = Array.from({ length: 100 }, (_, i) => ({
    timestamp: new Date(Date.now() - (i * 3600000)).toISOString(),
    confidence: 0.7 + Math.random() * 0.3,
    agent: ['researcher', 'architect', 'builder', 'reviewer'][Math.floor(Math.random() * 4)]
  }))

  const kpis = [
    {
      title: 'Agent Accuracy',
      value: '92.4%',
      change: '+4.2%',
      trend: 'up',
      icon: Target,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    },
    {
      title: 'Avg Response Time',
      value: '2.4s',
      change: '-18%',
      trend: 'down',
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Cost Efficiency',
      value: '$0.24/task',
      change: '-12%',
      trend: 'down',
      icon: DollarSign,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20'
    },
    {
      title: 'Token Usage',
      value: '1.2M',
      change: '+8%',
      trend: 'up',
      icon: Cpu,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20'
    }
  ]

  const insights = [
    {
      title: 'Multi-agent teams perform 3x better',
      description: 'Projects using 3+ agents showed significantly higher success rates',
      impact: 'High',
      recommendation: 'Use collaborative agent workflows for complex tasks'
    },
    {
      title: 'Gemini 3 Pro optimal for planning',
      description: 'Planning tasks showed 40% better results with Gemini 3 Pro vs Flash',
      impact: 'Medium',
      recommendation: 'Use Pro for planning, Flash for execution'
    },
    {
      title: 'Confidence drops after 8+ hours',
      description: 'Long-running agents show decreasing confidence beyond 8 hours',
      impact: 'Medium',
      recommendation: 'Implement agent rotation for long tasks'
    },
    {
      title: 'Cost spikes on Mondays',
      description: 'API usage costs are 35% higher on Mondays',
      impact: 'Low',
      recommendation: 'Schedule non-critical tasks for mid-week'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Insights</h1>
              <p className="text-gray-400">Intelligent analysis of agent performance and patterns</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="quarter">Last 90 days</option>
                <option value="year">Last year</option>
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon
              return (
                <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                      <Icon className={kpi.color} size={20} />
                    </div>
                    <span className={`text-sm font-medium ${kpi.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                      {kpi.change}
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1">{kpi.value}</div>
                  <div className="text-gray-400">{kpi.title}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trends */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Performance Trends</h2>
                <p className="text-sm text-gray-400">Weekly agent performance metrics</p>
              </div>
              <div className="flex items-center space-x-2">
                <button className={`px-3 py-1 rounded text-sm ${view === 'overview' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  Overview
                </button>
                <button className={`px-3 py-1 rounded text-sm ${view === 'detailed' ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'}`}>
                  Detailed
                </button>
              </div>
            </div>
            <AnalyticsChart 
              type="line" 
              data={performanceData}
              lines={['accuracy', 'speed', 'cost']}
            />
            <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-400">
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-green-500 mr-2" />
                <span>Accuracy</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-blue-500 mr-2" />
                <span>Speed (inverse)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-0.5 bg-purple-500 mr-2" />
                <span>Cost (inverse)</span>
              </div>
            </div>
          </div>

          {/* Confidence Heatmap */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Confidence Patterns</h2>
            <ConfidenceHeatmap data={confidenceData} timeRange="day" />
          </div>
        </div>

        {/* Insights Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">AI-Generated Insights</h2>
              <p className="text-sm text-gray-400">Patterns and recommendations from agent data</p>
            </div>
            <div className="flex items-center space-x-2 text-blue-400">
              <Sparkles size={18} />
              <span>Powered by Gemini 3</span>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {insights.map((insight, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-semibold text-lg">{insight.title}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    insight.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                    insight.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-green-500/20 text-green-400'
                  }`}>
                    {insight.impact} Impact
                  </span>
                </div>
                
                <p className="text-gray-400 mb-4">{insight.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Recommendation:</div>
                  <div className="text-sm text-blue-400 font-medium">{insight.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Opportunities */}
        <div className="bg-blue-900/15 border-2 border-blue-800/20 border border-blue-800/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">Optimization Opportunities</h2>
              <p className="text-sm text-gray-400">Areas for improvement based on data analysis</p>
            </div>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-medium">
              Estimated Savings: $1,240/month
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                area: 'Agent Configuration',
                improvement: 'Adjust timeout settings',
                impact: 'Reduces failed tasks by 15%',
                effort: 'Low'
              },
              {
                area: 'Model Selection',
                improvement: 'Use Flash for simple tasks',
                impact: 'Cuts costs by 25%',
                effort: 'Medium'
              },
              {
                area: 'Workflow Design',
                improvement: 'Add parallel processing',
                impact: 'Improves speed by 40%',
                effort: 'High'
              }
            ].map((item, index) => (
              <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
                <div className="text-sm font-medium mb-2">{item.area}</div>
                <div className="text-gray-300 mb-3">{item.improvement}</div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">{item.impact}</div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    item.effort === 'Low' ? 'bg-green-500/20 text-green-400' :
                    item.effort === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {item.effort} effort
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-blue-800/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Next Recommended Action</div>
                <div className="text-sm text-gray-400">Implement model selection optimization</div>
              </div>
              <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green rounded-lg font-medium transition-colors">
                Apply Optimization
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}