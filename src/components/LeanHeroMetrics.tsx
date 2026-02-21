'use client'

import { ROIOutputs, ROICalculator } from '@/lib/roi-calculator'

interface LeanHeroMetricsProps {
  outputs: ROIOutputs
}

export function LeanHeroMetrics({ outputs }: LeanHeroMetricsProps) {
  return (
    <div className="flex items-center justify-center space-x-8 py-3 bg-white border-b border-gray-100">
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-900">
          {outputs.breakEvenYear ? `Year ${outputs.breakEvenYear}` : 'No break-even'}
        </div>
        <div className="text-xs text-gray-500">Break-even</div>
      </div>
      
      <div className="text-center">
        <div className={`text-lg font-semibold ${outputs.roiYear5 > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {ROICalculator.formatPercentage(outputs.roiYear5)}
        </div>
        <div className="text-xs text-gray-500">ROI @ 5Y</div>
      </div>
      
      <div className="text-center">
        <div className={`text-lg font-semibold ${outputs.roiYear10 > 50 ? 'text-green-600' : 'text-gray-900'}`}>
          {ROICalculator.formatPercentage(outputs.roiYear10)}
        </div>
        <div className="text-xs text-gray-500">ROI @ 10Y</div>
      </div>
    </div>
  )
}
