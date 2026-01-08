'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface GaugeProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  size?: 'small' | 'medium' | 'large'
  showValue?: boolean
  showAnimation?: boolean
}

const sizeClasses = {
  small: 'h-2',
  medium: 'h-2.5',
  large: 'h-3',
}

export function Gauge({
  value,
  size = 'medium',
  showValue = true,
  showAnimation = true,
  className,
  ...props
}: GaugeProps) {
  const percentage = Math.min(100, Math.max(0, value))
  
  const getColor = (value: number) => {
    if (value < 30) return 'bg-green-500'
    if (value < 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className={cn('w-full space-y-1', className)} {...props}>
      <div className="w-full bg-gray-800 rounded-full overflow-hidden">
        <div
          className={cn(
            'rounded-full',
            getColor(percentage),
            sizeClasses[size],
            showAnimation && 'transition-all duration-1000 ease-out'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between text-xs text-gray-400">
          <span>0%</span>
          <span className="font-medium">{percentage}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  )
}
