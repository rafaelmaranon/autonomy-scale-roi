'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ROIOutputs, ROICalculator } from '@/lib/roi-calculator'

interface DetailsSectionProps {
  outputs: ROIOutputs
}

export function DetailsSection({ outputs }: DetailsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="bg-white rounded-lg border border-gray-200 mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-sm font-medium text-gray-900">Detailed Metrics</h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Required Cities */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {outputs.requiredCitiesFor5YearBreakeven} cities
              </div>
              <div className="text-xs text-gray-600">Required for 5Y Break-even</div>
            </div>

            {/* Network Miles 5Y */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {ROICalculator.formatNumber(outputs.totalNetworkMiles5y)}
              </div>
              <div className="text-xs text-gray-600">Total Miles (5Y)</div>
            </div>

            {/* Network Miles 10Y */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {ROICalculator.formatNumber(outputs.totalNetworkMiles10y)}
              </div>
              <div className="text-xs text-gray-600">Total Miles (10Y)</div>
            </div>

            {/* R&D per Mile 5Y */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-semibold text-gray-900">
                {ROICalculator.formatCurrency(outputs.rdAmortizedPerMile5y)}
              </div>
              <div className="text-xs text-gray-600">R&D per Mile (5Y)</div>
            </div>

            {/* R&D per Mile 10Y */}
            <div className={`rounded-lg p-3 ${
              outputs.rdAmortizedPerMile10y < 0.10 ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-semibold ${
                outputs.rdAmortizedPerMile10y < 0.10 ? 'text-green-700' : 'text-gray-900'
              }`}>
                {ROICalculator.formatCurrency(outputs.rdAmortizedPerMile10y)}
              </div>
              <div className="text-xs text-gray-600">R&D per Mile (10Y)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
