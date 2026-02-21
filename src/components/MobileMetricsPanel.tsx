'use client'

import { ROIOutputs, ROICalculator } from '@/lib/roi-calculator'
import { Accordion } from './Accordion'

interface MobileMetricsPanelProps {
  outputs: ROIOutputs
}

export function MobileMetricsPanel({ outputs }: MobileMetricsPanelProps) {
  return (
    <Accordion title="More Metrics" defaultOpen={false} className="lg:hidden">
      <div className="pt-4 space-y-4">
        {/* Network Scale */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Network Scale</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">
                {ROICalculator.formatNumber(outputs.totalNetworkMiles5y)}
              </div>
              <div className="text-xs text-gray-600">Total Miles (5Y)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">
                {ROICalculator.formatNumber(outputs.totalNetworkMiles10y)}
              </div>
              <div className="text-xs text-gray-600">Total Miles (10Y)</div>
            </div>
          </div>
        </div>

        {/* R&D Amortization */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">R&D Amortization</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-lg font-bold text-gray-900">
                {ROICalculator.formatCurrency(outputs.rdAmortizedPerMile5y)}
              </div>
              <div className="text-xs text-gray-600">R&D per Mile (5Y)</div>
            </div>
            <div className={`rounded-lg p-3 ${
              outputs.rdAmortizedPerMile10y < 0.10 ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className={`text-lg font-bold ${
                outputs.rdAmortizedPerMile10y < 0.10 ? 'text-green-700' : 'text-gray-900'
              }`}>
                {ROICalculator.formatCurrency(outputs.rdAmortizedPerMile10y)}
              </div>
              <div className="text-xs text-gray-600">R&D per Mile (10Y)</div>
            </div>
          </div>
        </div>

        {/* Required Cities */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Break-even Analysis</h4>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-gray-900">
              {outputs.requiredCitiesFor5YearBreakeven} cities
            </div>
            <div className="text-xs text-gray-600">Required for 5Y Break-even</div>
          </div>
        </div>
      </div>
    </Accordion>
  )
}
