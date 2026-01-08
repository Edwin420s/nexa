import { useState } from 'react';
import AnalyticsChart from '@/components/AnalyticsChart';

interface RealTimeChartsProps {
  realTimeData: any[];
  activeMetric: string;
  onMetricChange: (metric: string) => void;
}

export function RealTimeCharts({ realTimeData, activeMetric, onMetricChange }: RealTimeChartsProps) {
  return (
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
              onClick={() => onMetricChange(metric)}
              className={`px-3 py-1 text-sm rounded-lg capitalize ${
                activeMetric === metric ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
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
  );
}
