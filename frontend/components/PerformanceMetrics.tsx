'use client'

import { Clock, Activity, AlertCircle, DollarSign, Cpu, Database } from 'lucide-react'

export interface Metric {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  icon: React.ComponentType<{ className?: string }>
  color: string
  target: string
}

interface PerformanceMetricsProps {
  metrics: Metric[]
}

export function PerformanceMetrics({ metrics }: PerformanceMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon
        return (
          <div key={idx} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gray-800`}>
                <Icon className={`${metric.color} w-5 h-5`} />
              </div>
              <span className={`text-sm font-medium ${metric.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                {metric.change}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{metric.value}</div>
            <div className="text-sm text-gray-400">{metric.title}</div>
            <div className="text-xs text-gray-500 mt-2">
              <span className="text-gray-400">Target:</span> {metric.target}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const defaultMetrics: Metric[] = [
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
