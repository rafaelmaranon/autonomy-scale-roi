'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MapPin, Check, X, FileText, Plus } from 'lucide-react'
import { SimInputs, SimOutputs, SimYearData } from '@/lib/sim-types'
import type { Candidate } from '@/lib/insights-schema'

type ActionType = 'answer' | 'city_request' | 'url_extract'
interface InsightsActionPayload {
  type: ActionType
  answer_markdown?: string
  key_levers?: any[]
  suggested_next_inputs?: any[]
  city_query?: string
  needs_clarification?: boolean
  clarification_question?: string
  url?: string
  candidates?: Candidate[]
  [key: string]: any
}

interface InsightsPanelProps {
  inputs: SimInputs
  outputs: SimOutputs
  activeYearData: SimYearData
  onCityRequested?: () => void
  onAnchorsChanged?: () => void
}

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  action?: InsightsActionPayload
  cityPreview?: { place_name: string; lat: number; lon: number; mapbox_id: string; country: string; region: string; already_requested?: boolean }
  candidates?: Candidate[]
}

const INSIGHT_CHIPS = [
  "What drives break-even most?",
  "Which input has the biggest leverage?",
  "I want Waymo in my city",
]

export function InsightsPanel({ inputs, outputs, activeYearData, onCityRequested, onAnchorsChanged }: InsightsPanelProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const finalYear = outputs.yearlyData[outputs.yearlyData.length - 1]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  // Build context for /api/insights
  const buildContext = () => ({
    company: 'Waymo',
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
    },
  })

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg])
  }

  // -----------------------------------------------------------------------
  // Main send handler — routes everything through /api/insights
  // -----------------------------------------------------------------------
  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return
    setInput('')
    addMessage({ role: 'user', text: text.trim() })
    setIsLoading(true)

    try {
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), context: buildContext() }),
      })
      const data = await res.json()

      if (!data.ok) {
        addMessage({ role: 'assistant', text: data.error || 'Something went wrong. Please try again.' })
        return
      }

      const action = data.action as InsightsActionPayload
      await handleAction(action)

    } catch {
      addMessage({ role: 'assistant', text: 'Network error. Please check your connection.' })
    } finally {
      setIsLoading(false)
    }
  }

  // -----------------------------------------------------------------------
  // Action router
  // -----------------------------------------------------------------------
  const handleAction = async (action: InsightsActionPayload) => {
    switch (action.type) {
      case 'answer':
        addMessage({
          role: 'assistant',
          text: action.answer_markdown || 'No response.',
          action,
        })
        break

      case 'city_request':
        await handleCityRequestAction(action)
        break

      case 'url_extract':
        handleUrlExtractAction(action)
        break

      default:
        addMessage({ role: 'assistant', text: `Unknown action type: ${action.type}` })
    }
  }

  // -----------------------------------------------------------------------
  // City request flow: clarify → preview → confirm
  // -----------------------------------------------------------------------
  const handleCityRequestAction = async (action: InsightsActionPayload) => {
    if (action.needs_clarification) {
      addMessage({
        role: 'assistant',
        text: action.clarification_question || 'Which city would you like to request? Please include the country or state.',
        action,
      })
      return
    }

    // Preview: geocode the city
    addMessage({ role: 'assistant', text: `Looking up "${action.city_query}"...` })

    try {
      const res = await fetch('/api/city-request/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: action.city_query }),
      })
      const data = await res.json()

      if (!data.ok) {
        // Replace the "Looking up" message with error
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', text: data.error || `Could not find "${action.city_query}".` }
          return updated
        })
        return
      }

      if (data.already_requested) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            text: `${data.result.place_name} has already been requested! Thanks for the enthusiasm.`,
          }
          return updated
        })
        return
      }

      // Show confirmation prompt
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          text: `I found: **${data.result.place_name}**. Add it to the map as a requested city?`,
          cityPreview: data.result,
        }
        return updated
      })

    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', text: 'Failed to look up the city. Please try again.' }
        return updated
      })
    }
  }

  // -----------------------------------------------------------------------
  // City confirm / cancel
  // -----------------------------------------------------------------------
  const handleCityConfirm = async (preview: ChatMessage['cityPreview']) => {
    if (!preview) return
    setIsLoading(true)

    try {
      const res = await fetch('/api/city-request/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result: preview }),
      })
      const data = await res.json()

      if (data.ok && !data.duplicate) {
        addMessage({ role: 'assistant', text: `Added ${preview.place_name} to the map! It now appears as a "Requested" marker.` })
        onCityRequested?.()
      } else if (data.duplicate) {
        addMessage({ role: 'assistant', text: `${preview.place_name} was already requested.` })
      } else {
        addMessage({ role: 'assistant', text: data.error || 'Failed to save. Please try again.' })
      }
    } catch {
      addMessage({ role: 'assistant', text: 'Network error.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCityCancel = () => {
    addMessage({ role: 'assistant', text: 'No problem. Let me know if you want to request a different city.' })
  }

  // -----------------------------------------------------------------------
  // URL extract flow: show candidates → add
  // -----------------------------------------------------------------------
  const handleUrlExtractAction = (action: InsightsActionPayload) => {
    if (!action.candidates || action.candidates.length === 0) {
      addMessage({ role: 'assistant', text: `I checked ${action.url} but couldn't find any numeric datapoints to extract. Try pasting the relevant paragraph directly.` })
      return
    }

    addMessage({
      role: 'assistant',
      text: `Found **${action.candidates.length}** datapoint${action.candidates.length > 1 ? 's' : ''} from this article:`,
      candidates: action.candidates,
      action,
    })
  }

  const handleAddCandidate = async (candidate: Candidate) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/anchors/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      })
      const data = await res.json()
      if (data.ok) {
        addMessage({ role: 'assistant', text: `Added: ${candidate.metric} = ${candidate.value} ${candidate.unit} (${candidate.year}) as pending.` })
        onAnchorsChanged?.()
      } else {
        addMessage({ role: 'assistant', text: data.error || 'Failed to add datapoint.' })
      }
    } catch {
      addMessage({ role: 'assistant', text: 'Network error.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAllCandidates = async (candidates: Candidate[]) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/anchors/insert-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      })
      const data = await res.json()
      if (data.ok) {
        addMessage({ role: 'assistant', text: `Added ${data.inserted_count} datapoints as pending.` })
        onAnchorsChanged?.()
      } else {
        addMessage({ role: 'assistant', text: data.error || 'Failed to add datapoints.' })
      }
    } catch {
      addMessage({ role: 'assistant', text: 'Network error.' })
    } finally {
      setIsLoading(false)
    }
  }

  // -----------------------------------------------------------------------
  // UI
  // -----------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSend(input)
  }

  return (
    <div className="pt-4 pb-8">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Insights</h3>

      {/* Chips */}
      <div className="flex flex-wrap gap-2 mb-3">
        {INSIGHT_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full transition-colors border border-blue-200 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      {messages.length > 0 && (
        <div ref={scrollRef} className="max-h-[300px] overflow-y-auto mb-3 space-y-2">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-50 border border-gray-200 text-gray-800'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

                {/* City preview confirm/cancel */}
                {msg.cityPreview && (
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleCityConfirm(msg.cityPreview)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <MapPin size={12} /> Add
                    </button>
                    <button
                      onClick={handleCityCancel}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                )}

                {/* URL extract candidates */}
                {msg.candidates && msg.candidates.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.candidates.map((c, ci) => (
                      <div key={ci} className="flex items-start justify-between gap-2 bg-white rounded border border-gray-100 p-2">
                        <div className="text-xs text-gray-700 min-w-0">
                          <div className="font-medium">{c.metric}: {c.value.toLocaleString()} {c.unit}</div>
                          <div className="text-gray-500">{c.year}{c.city ? ` · ${c.city}` : ''}</div>
                          {c.evidence_quote && <div className="text-gray-400 italic truncate">"{c.evidence_quote}"</div>}
                        </div>
                        <button
                          onClick={() => handleAddCandidate(c)}
                          disabled={isLoading}
                          className="shrink-0 p-1 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                          title="Add as pending"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddAllCandidates(msg.candidates!)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 w-full justify-center"
                    >
                      <Check size={12} /> Add all as pending
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this scenario, request a city, or paste a URL..."
          className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span className="hidden sm:inline">{isLoading ? 'Thinking...' : 'Send'}</span>
        </button>
      </form>
    </div>
  )
}
