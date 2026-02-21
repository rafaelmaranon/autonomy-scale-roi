'use client'

import { useState } from 'react'
import { X, Send, Loader2 } from 'lucide-react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'
import { analytics } from '@/lib/analytics'

interface AskAIProps {
  inputs: ROIInputs
  outputs: ROIOutputs
  onClose: () => void
}

export function AskAI({ inputs, outputs, onClose }: AskAIProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    const startTime = Date.now()

    analytics.logEvent('ai_question', {
      question: question.trim(),
      inputs,
      outputs: {
        breakEvenYear: outputs.breakEvenYear,
        roiYear5: outputs.roiYear5,
        roiYear10: outputs.roiYear10
      }
    })

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question.trim(),
          context: {
            inputs,
            outputs: {
              breakEvenYear: outputs.breakEvenYear,
              roiYear5: outputs.roiYear5,
              roiYear10: outputs.roiYear10,
              totalNetworkMiles5y: outputs.totalNetworkMiles5y,
              totalNetworkMiles10y: outputs.totalNetworkMiles10y,
              requiredCitiesFor5YearBreakeven: outputs.requiredCitiesFor5YearBreakeven
            }
          }
        }),
      })

      const data = await response.json()
      const latency = Date.now() - startTime

      if (response.ok) {
        setResponse(data.response)
        analytics.logEvent('ai_response', {
          question: question.trim(),
          response: data.response,
          latency_ms: latency,
          success: true
        })
      } else {
        setResponse('Sorry, I encountered an error processing your question. Please try again.')
        analytics.logEvent('ai_response', {
          question: question.trim(),
          error: data.error || 'Unknown error',
          latency_ms: latency,
          success: false
        })
      }
    } catch (error) {
      const latency = Date.now() - startTime
      setResponse('Sorry, I encountered a network error. Please check your connection and try again.')
      analytics.logEvent('ai_response', {
        question: question.trim(),
        error: 'Network error',
        latency_ms: latency,
        success: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  const suggestedQuestions = [
    "What drives the break-even timing in this scenario?",
    "Which input has the biggest impact on ROI?",
    "How could I accelerate the payback period?",
    "What are the key risks with these assumptions?",
    "How sensitive is this model to profit per mile changes?"
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Ask AI</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Current Scenario Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Current Scenario</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• Fixed Investment: ${inputs.fixedInvestment}B</p>
              <p>• Profit per Mile: ${inputs.profitPerMile}</p>
              <p>• Launch Rate: {inputs.citiesPerYear} cities/year</p>
              <p>• Break-even: {outputs.breakEvenYear ? `Year ${outputs.breakEvenYear}` : 'Never'}</p>
              <p>• 5Y ROI: {outputs.roiYear5.toFixed(1)}%</p>
            </div>
          </div>

          {/* Suggested Questions */}
          {!response && (
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Suggested Questions</h3>
              <div className="space-y-2">
                {suggestedQuestions.map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestion(q)}
                    className="text-left w-full p-3 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Response */}
          {response && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">AI Analysis</h3>
              <div className="text-sm text-blue-800 whitespace-pre-wrap">
                {response}
              </div>
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about break-even drivers, sensitivity, risks, or optimization strategies..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!question.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
              <span>{isLoading ? 'Thinking...' : 'Ask'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
