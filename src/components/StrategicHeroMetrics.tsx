'use client'

import { ROIOutputs, ROICalculator, ROIInputs } from '@/lib/roi-calculator'

interface StrategicHeroMetricsProps {
  outputs: ROIOutputs
  inputs: ROIInputs
}

export function StrategicHeroMetrics({ outputs, inputs }: StrategicHeroMetricsProps) {
  // Calculate fleet size at year 10
  const year10Data = outputs.yearlyData[9] // Index 9 = Year 10
  const fleetSizeYear10 = year10Data ? Math.floor(year10Data.totalVehicles) : 0

  // Determine status based on ROI and break-even
  const getStatus = () => {
    if (outputs.roiYear10 < 0) {
      return { text: 'Unprofitable', color: 'text-red-600 bg-red-50' }
    }
    if (!outputs.breakEvenYear || outputs.breakEvenYear > 8) {
      return { text: 'Long Payback', color: 'text-orange-600 bg-orange-50' }
    }
    if (outputs.breakEvenYear <= 5) {
      return { text: 'Attractive', color: 'text-green-600 bg-green-50' }
    }
    return { text: 'Moderate', color: 'text-blue-600 bg-blue-50' }
  }

  const status = getStatus()

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-white border-b border-gray-100">
      <div className="flex items-center space-x-8">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {outputs.breakEvenYear ? `${outputs.breakEvenYear} years` : 'No break-even'}
          </div>
          <div className="text-xs text-gray-500">Break-even</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-bold ${outputs.roiYear5 > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {ROICalculator.formatPercentage(outputs.roiYear5)}
          </div>
          <div className="text-xs text-gray-500">ROI (5y)</div>
        </div>
        
        <div className="text-center">
          <div className={`text-lg font-bold ${outputs.roiYear10 > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {ROICalculator.formatPercentage(outputs.roiYear10)}
          </div>
          <div className="text-xs text-gray-500">ROI (10y)</div>
        </div>

        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {fleetSizeYear10.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Fleet Size (Year 10)</div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color}`}>
        Status: {status.text}
      </div>
    </div>
  )
}
