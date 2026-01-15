import { TrendingUp } from 'lucide-react';

interface Recommendation {
  area: string;
  recommendation: string;
  impact: string;
  effort: 'Low' | 'Medium' | 'High';
  priority: 'Low' | 'Medium' | 'High';
}

interface PerformanceRecommendationsProps {
  recommendations: Recommendation[];
}

export function PerformanceRecommendations({ recommendations }: PerformanceRecommendationsProps) {
  return (
    <div className="bg-blue-900/15 border-2 border-blue-800/20 border border-blue-800/30 rounded-xl p-6">
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
        {recommendations.map((rec, idx) => (
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
          <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 border-2 border-emerald-500 hover:border-emerald-400 shadow-glow-green rounded-lg font-medium transition-colors">
            Apply Optimization
          </button>
        </div>
      </div>
    </div>
  );
}
