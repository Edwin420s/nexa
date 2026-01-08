import { AlertCircle } from 'lucide-react';

interface Alert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  time: string;
  agent: string;
}

interface AlertsSectionProps {
  alerts: Alert[];
}

export function AlertsSection({ alerts }: AlertsSectionProps) {
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
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
  );
}
