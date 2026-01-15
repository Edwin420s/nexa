'use client'

import { Gauge } from './ui/gauge'

interface AgentPerformanceData {
  agent: string
  latency: string
  successRate: string
  costPerTask: string
  tokensPerTask: number
  utilization: string
}

interface AgentPerformanceProps {
  data: AgentPerformanceData[]
}

export function AgentPerformance({ data }: AgentPerformanceProps) {
  return (
    <div className="space-y-4">
      {data.map((agent, idx) => (
        <div key={idx} className="border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500/30 shadow-glow-blue flex items-center justify-center">
                <span className="font-bold text-blue-300">{agent.agent.charAt(0)}</span>
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
          
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Performance</span>
              <span>{agent.utilization} Utilization</span>
            </div>
            <Gauge 
              value={parseInt(agent.utilization)} 
              size="small"
              showValue={false}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export const defaultAgentData: AgentPerformanceData[] = [
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
