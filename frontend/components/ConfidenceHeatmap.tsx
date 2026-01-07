'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ConfidenceData {
  timestamp: string
  confidence: number
  agent: string
}

interface ConfidenceHeatmapProps {
  data: ConfidenceData[]
  timeRange?: 'hour' | 'day' | 'week' | 'month'
}

export default function ConfidenceHeatmap({ data, timeRange = 'day' }: ConfidenceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number; data: ConfidenceData } | null>(null)

  // Group data by agent and time slot
  const agents = Array.from(new Set(data.map(d => d.agent)))
  const timeSlots = Array.from(new Set(data.map(d => d.timestamp))).slice(0, 24) // Last 24 time slots

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'bg-green-500'
    if (confidence >= 0.8) return 'bg-green-400'
    if (confidence >= 0.7) return 'bg-yellow-400'
    if (confidence >= 0.6) return 'bg-yellow-500'
    if (confidence >= 0.5) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'Excellent'
    if (confidence >= 0.8) return 'Good'
    if (confidence >= 0.7) return 'Fair'
    if (confidence >= 0.6) return 'Low'
    return 'Poor'
  }

  const getTrendIcon = (index: number, agent: string) => {
    const agentData = data.filter(d => d.agent === agent).sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    
    if (index < 2) return null
    
    const current = agentData[index]?.confidence || 0
    const previous = agentData[index - 1]?.confidence || 0
    
    if (current > previous + 0.05) return <TrendingUp size={12} className="text-green-400" />
    if (current < previous - 0.05) return <TrendingDown size={12} className="text-red-400" />
    return <Minus size={12} className="text-gray-400" />
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold">Confidence Heatmap</h3>
          <p className="text-sm text-gray-400">Agent confidence over time</p>
        </div>
        <div className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-sm text-gray-400">High (90%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-sm text-gray-400">Low (&lt;60%)</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Time Slot Headers */}
          <div className="flex mb-4">
            <div className="w-32" /> {/* Agent name column */}
            {timeSlots.map((slot, index) => (
              <div key={slot} className="w-16 text-center">
                <div className="text-xs text-gray-400 font-medium">
                  {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {/* Agent Rows */}
          {agents.map((agent) => (
            <div key={agent} className="flex items-center mb-2">
              <div className="w-32 pr-4">
                <div className="text-sm font-medium truncate">{agent}</div>
              </div>
              
              {timeSlots.map((slot, timeIndex) => {
                const cellData = data.find(d => d.agent === agent && d.timestamp === slot)
                const confidence = cellData?.confidence || 0
                
                return (
                  <div
                    key={`${agent}-${slot}`}
                    className="w-16 h-16 p-1"
                    onMouseEnter={() => cellData && setHoveredCell({ x: timeIndex, y: agents.indexOf(agent), data: cellData })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    <div className={`relative w-full h-full rounded ${getConfidenceColor(confidence)} ${confidence > 0 ? 'opacity-80 hover:opacity-100' : 'opacity-20'}`}>
                      {confidence > 0 && (
                        <>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {(confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="absolute top-1 right-1">
                            {getTrendIcon(timeIndex, agent)}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Hover Tooltip */}
      {hoveredCell && (
        <div 
          className="absolute z-50 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl"
          style={{
            left: `${hoveredCell.x * 64 + 200}px`,
            top: `${hoveredCell.y * 64 + 120}px`,
          }}
        >
          <div className="text-sm font-medium mb-1">{hoveredCell.data.agent}</div>
          <div className="text-xs text-gray-400 mb-2">
            {new Date(hoveredCell.data.timestamp).toLocaleString()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Confidence:</span>
            <span className="text-lg font-bold">
              {(hoveredCell.data.confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {getConfidenceLabel(hoveredCell.data.confidence)}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center mt-6 space-x-4">
        {[0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((value) => (
          <div key={value} className="flex items-center space-x-2">
            <div className={`w-4 h-4 rounded ${getConfidenceColor(value)}`} />
            <span className="text-xs text-gray-400">{value * 100}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}