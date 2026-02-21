'use client'

import { ROIOutputs, ROICalculator } from '@/lib/roi-calculator'

interface HeroMetricsProps {
  outputs: ROIOutputs
}

export function HeroMetrics({ outputs }: HeroMetricsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 lg:hidden">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            {outputs.breakEvenYear ? `Y${outputs.breakEvenYear}` : 'Never'}
          </div>
          <div className="text-xs text-gray-600 mt-1">Break-even</div>
        </div>
        
        <div className="text-center border-l border-r border-gray-200">
          <div className={`text-2xl font-bold ${outputs.roiYear5 > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {ROICalculator.formatPercentage(outputs.roiYear5)}
          </div>
          <div className="text-xs text-gray-600 mt-1">ROI 5Y</div>
        </div>
        
        <div className="text-center">
          <div className={`text-2xl font-bold ${outputs.roiYear10 > 50 ? 'text-green-600' : 'text-gray-900'}`}>
            {ROICalculator.formatPercentage(outputs.roiYear10)}
          </div>
          <div className="text-xs text-gray-600 mt-1">ROI 10Y</div>
        </div>
      </div>
    </div>
  )
}
