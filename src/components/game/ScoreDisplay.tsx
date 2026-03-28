interface ScoreDisplayProps {
  score: number
  stage: number
}

export function ScoreDisplay({ score, stage }: ScoreDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-4">
      <div className="text-4xl font-bold text-gray-900">{score}</div>
      <div className="text-sm text-gray-500">스테이지 {stage}</div>
      {stage >= 10 && (
        <div className="text-sm font-bold text-orange-500 animate-pulse">COMBO!</div>
      )}
    </div>
  )
}
