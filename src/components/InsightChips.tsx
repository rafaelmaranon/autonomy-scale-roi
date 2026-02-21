'use client'

interface InsightChipsProps {
  onChipClick: (prompt: string) => void
}

export function InsightChips({ onChipClick }: InsightChipsProps) {
  const insights = [
    "What drives break-even most?",
    "What must change to break even by year 5?",
    "Which input has most leverage?"
  ]

  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {insights.map((insight, index) => (
        <button
          key={index}
          onClick={() => onChipClick(insight)}
          className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors border border-blue-200"
        >
          {insight}
        </button>
      ))}
    </div>
  )
}
