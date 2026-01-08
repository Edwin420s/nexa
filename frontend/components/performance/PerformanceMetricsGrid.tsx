import { Clock, Activity, AlertCircle, DollarSign, Cpu, Database } from 'lucide-react';

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ComponentType<{ className?: string; size?: number }>;
  color: string;
  target: string;
}

interface PerformanceMetricsGridProps {
  metrics: Metric[];
}

export function PerformanceMetricsGrid({ metrics }: PerformanceMetricsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {metrics.map((metric, idx) => {
        const Icon = metric.icon;
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
        );
      })}
    </div>
  );
}
