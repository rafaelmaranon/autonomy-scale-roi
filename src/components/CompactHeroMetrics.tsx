'use client'

import { ROIInputs, ROIOutputs, ROICalculator } from '@/lib/roi-calculator'

interface CompactHeroMetricsProps {
  outputs: ROIOutputs
  inputs: ROIInputs
}

export function CompactHeroMetrics({ outputs, inputs }: CompactHeroMetricsProps) {
  // Calculate fleet size at year 10
  const year10Data = outputs.yearlyData[9] || outputs.yearlyData[outputs.yearlyData.length - 1]
  const fleetSize = year10Data ? Math.floor(year10Data.totalVehicles) : 0

  // Determine status based on ROI and break-even
  const getStatus = () => {
    if (outputs.roiYear10 < 0) return { text: 'Unprofitable', color: 'text-red-600 bg-red-50' }
    if (!outputs.breakEvenYear || outputs.breakEvenYear > 8) return { text: 'Long Payback', color: 'text-orange-600 bg-orange-50' }
    if (outputs.breakEvenYear <= 5) return { text: 'Attractive', color: 'text-green-600 bg-green-50' }
    return { text: 'Moderate', color: 'text-blue-600 bg-blue-50' }
  }

  const status = getStatus()

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="grid grid-cols-5 gap-3 text-center">
        {/* Break-even */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Break-even</div>
          <div className="text-lg font-bold text-gray-900">
            {outputs.breakEvenYear ? `Y${outputs.breakEvenYear}` : 'Never'}
          </div>
        </div>

        {/* ROI 5Y */}
        <div>
          <div className="text-xs text-gray-600 mb-1">ROI (5Y)</div>
          <div className={`text-lg font-bold ${
            outputs.roiYear5 >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {ROICalculator.formatPercentage(outputs.roiYear5)}
          </div>
        </div>

        {/* ROI 10Y */}
        <div>
          <div className="text-xs text-gray-600 mb-1">ROI (10Y)</div>
          <div className={`text-lg font-bold ${
            outputs.roiYear10 >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {ROICalculator.formatPercentage(outputs.roiYear10)}
          </div>
        </div>

        {/* Fleet Size */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Fleet (Y10)</div>
          <div className="text-lg font-bold text-gray-900">
            {fleetSize >= 1000 ? `${(fleetSize / 1000).toFixed(0)}K` : fleetSize.toLocaleString()}
          </div>
        </div>

        {/* Status */}
        <div>
          <div className="text-xs text-gray-600 mb-1">Status</div>
          <div className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
            {status.text}
          </div>
        </div>
      </div>
    </div>
  )
}
