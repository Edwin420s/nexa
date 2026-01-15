interface ConfidenceBarProps {
  confidence: number // 0 to 1
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ConfidenceBar({ 
  confidence, 
  showLabel = true,
  size = 'md' 
}: ConfidenceBarProps) {
  const getColor = (value: number) => {
    if (value >= 0.8) return 'bg-emerald-500 shadow-glow-green'
    if (value >= 0.6) return 'bg-gradient-to-r from-yellow-500 to-amber-500'
    return 'bg-gradient-to-r from-red-500 to-orange-500'
  }

  const getSize = () => {
    switch (size) {
      case 'sm': return 'h-1.5'
      case 'lg': return 'h-3'
      default: return 'h-2'
    }
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm text-gray-400">
            Confidence: {(confidence * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <div className="w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`${getColor(confidence)} ${getSize()} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
    </div>
  )
}