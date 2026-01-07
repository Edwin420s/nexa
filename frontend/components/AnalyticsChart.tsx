'use client'

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface AnalyticsChartProps {
  type: 'line' | 'bar'
  data: any[]
  lines?: string[]
  bars?: string[]
}

export default function AnalyticsChart({ type, data, lines, bars }: AnalyticsChartProps) {
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  if (type === 'line') {
    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '0.5rem'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Legend />
            {lines?.map((line, index) => (
              <Line
                key={line}
                type="monotone"
                dataKey={line}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="name" 
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis 
            stroke="#9ca3af"
            fontSize={12}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '0.5rem'
            }}
            labelStyle={{ color: '#d1d5db' }}
          />
          <Legend />
          {bars?.map((bar, index) => (
            <Bar
              key={bar}
              dataKey={bar}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Sample analytics data
export const sampleAnalyticsData = [
  { name: 'Mon', projects: 4, agents: 12, confidence: 82 },
  { name: 'Tue', projects: 3, agents: 9, confidence: 78 },
  { name: 'Wed', projects: 6, agents: 18, confidence: 85 },
  { name: 'Thu', projects: 5, agents: 15, confidence: 80 },
  { name: 'Fri', projects: 7, agents: 21, confidence: 88 },
  { name: 'Sat', projects: 2, agents: 6, confidence: 75 },
  { name: 'Sun', projects: 1, agents: 3, confidence: 70 }
]