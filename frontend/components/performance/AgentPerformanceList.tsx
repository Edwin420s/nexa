interface AgentPerformance {
  agent: string;
  latency: string;
  successRate: string;
  costPerTask: string;
  tokensPerTask: number;
  utilization: string;
}

interface AgentPerformanceListProps {
  agents: AgentPerformance[];
}

export function AgentPerformanceList({ agents }: AgentPerformanceListProps) {
  return (
    <div className="space-y-4">
      {agents.map((agent, idx) => (
        <div key={idx} className="border border-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 border-2 border-blue-500/30 shadow-glow-blue flex items-center justify-center">
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
  );
}
