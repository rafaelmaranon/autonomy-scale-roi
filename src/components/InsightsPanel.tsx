'use client'

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { SimInputs, SimOutputs, SimYearData } from '@/lib/sim-types'

interface InsightsPanelProps {
  inputs: SimInputs
  outputs: SimOutputs
  activeYearData: SimYearData
  onCityRequested?: () => void
}

const INSIGHT_CHIPS = [
  "What drives break-even most?",
  "Which input has the biggest leverage?",
  "I want Waymo in my city",
]

const CITY_REQUEST_PATTERNS = [
  /i want (?:waymo|autonomy|self[- ]driving) in (.+)/i,
  /(?:add|request|deploy|launch|bring)(?: (?:waymo|it))? (?:in|to) (.+)/i,
  /my (?:city|town|area) is (.+)/i,
  /(?:waymo|expand) to (.+)/i,
]

function extractCityRequest(text: string): string | null {
  for (const pattern of CITY_REQUEST_PATTERNS) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/[.!?]+$/, '')
  }
  return null
}

export function InsightsPanel({ inputs, outputs, activeYearData, onCityRequested }: InsightsPanelProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const finalYear = outputs.yearlyData[outputs.yearlyData.length - 1]

  const handleCityRequest = async (cityName: string) => {
    setIsLoading(true)
    setResponse('')
    try {
      const res = await fetch('/api/city-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: cityName }),
      })
      const data = await res.json()
      if (data.duplicate) {
        setResponse(`${data.place_name} has already been requested! Thanks for the enthusiasm.`)
      } else if (data.success) {
        setResponse(`Added ${data.place_name} to the map \u2705\nIt now appears as a \"Requested\" marker.`)
        onCityRequested?.()
      } else {
        setResponse(data.error || 'Could not process city request. Try a more specific city name.')
      }
    } catch {
      setResponse('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAsk = async (q: string) => {
    if (!q.trim() || isLoading) return
    setQuestion(q)

    // Check for city request intent first
    const cityName = extractCityRequest(q)
    if (cityName) {
      await handleCityRequest(cityName)
      return
    }

    setIsLoading(true)
    setResponse('')

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.trim(),
          context: {
            inputs: {
              citiesPerYear: inputs.citiesPerYear,
              vehiclesPerCity: inputs.vehiclesPerCity,
              annualRDSpend: inputs.annualRDSpend,
              rampTimePerCity: inputs.rampTimePerCity,
              profitPerMile: inputs.profitPerMile,
              startYear: inputs.startYear,
              yearsToSimulate: inputs.yearsToSimulate,
            },
            outputs: {
              breakEvenYear: outputs.breakEvenYear,
              cumulativeNetCash: finalYear?.cumulativeNetCash,
              paidTripsPerWeek: finalYear?.paidTripsPerWeek,
              fleetSize: finalYear?.vehiclesProduction,
              cumulativeMiles: (finalYear?.productionMiles || 0) + (finalYear?.validationMiles || 0),
            }
          }
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setResponse(data.response)
      } else {
        setResponse('Sorry, I encountered an error. Please try again.')
      }
    } catch {
      setResponse('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleAsk(question)
  }

  const handleChipClick = (chip: string) => {
    setQuestion(chip)
    handleAsk(chip)
  }

  return (
    <div className="pt-4 pb-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Insights</h3>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {INSIGHT_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleChipClick(chip)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors border border-blue-200 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this scenario…"
          className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
          <span>{isLoading ? 'Thinking…' : 'Ask'}</span>
        </button>
      </form>

      {/* Response */}
      {(response || isLoading) && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              <span>Analyzing your scenario…</span>
            </div>
          ) : (
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {response}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
