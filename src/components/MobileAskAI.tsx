'use client'

import { useState } from 'react'
import { X, Send, Loader2, MessageCircle } from 'lucide-react'
import { ROIInputs, ROIOutputs } from '@/lib/roi-calculator'
import { analytics } from '@/lib/analytics'

interface MobileAskAIProps {
  inputs: ROIInputs
  outputs: ROIOutputs
}

export function MobileAskAI({ inputs, outputs }: MobileAskAIProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  const handleOpen = () => {
    setIsOpen(true)
    analytics.logEvent('ai_opened', {
      opened: true
    })
  }

  const suggestedQuestions = [
    "What drives break-even timing?",
    "Which input has biggest ROI impact?",
    "How to accelerate payback?",
    "Key risks with assumptions?"
  ]

  return (
    <>
      {/* Floating Button - Mobile Only */}
      <button
        onClick={handleOpen}
        className="lg:hidden fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors z-40"
      >
        <MessageCircle size={24} />
      </button>

      {/* Bottom Sheet Modal - Mobile Only */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Ask AI</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Current Scenario Summary */}
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="font-medium text-gray-900 mb-2 text-sm">Current Scenario</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• Investment: ${inputs.fixedInvestment}B • Profit/Mile: ${inputs.profitPerMile}</p>
                  <p>• Break-even: {outputs.breakEvenYear ? `Year ${outputs.breakEvenYear}` : 'Never'} • 5Y ROI: {outputs.roiYear5.toFixed(1)}%</p>
                </div>
              </div>

              {/* Suggested Questions */}
              {!response && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">Quick Questions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedQuestions.map((q, index) => (
                      <button
                        key={index}
                        onClick={() => setQuestion(q)}
                        className="text-left p-2 text-xs bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-700"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Response */}
              {response && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <h3 className="font-medium text-blue-900 mb-2 text-sm">AI Analysis</h3>
                  <div className="text-xs text-blue-800 whitespace-pre-wrap">
                    {response}
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask about break-even, sensitivity, risks..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!question.trim() || isLoading}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
