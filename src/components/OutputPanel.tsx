'use client'

import { ROIOutputs, ROICalculator } from '@/lib/roi-calculator'

interface OutputPanelProps {
  outputs: ROIOutputs
}

export function OutputPanel({ outputs }: OutputPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Key Metrics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Break-even Analysis */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Break-even Analysis</h3>
          
          <MetricCard
            label="Break-even Year"
            value={outputs.breakEvenYear ? `Year ${outputs.breakEvenYear}` : 'Never'}
            description="When cumulative profit exceeds fixed investment"
            highlight={outputs.breakEvenYear !== null && outputs.breakEvenYear <= 7}
          />
          
          <MetricCard
            label="Required Cities (5Y Break-even)"
            value={`${outputs.requiredCitiesFor5YearBreakeven} cities`}
            description="Minimum cities needed for 5-year payback"
          />
        </div>

        {/* ROI Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Return on Investment</h3>
          
          <MetricCard
            label="ROI at Year 5"
            value={ROICalculator.formatPercentage(outputs.roiYear5)}
            description="5-year return on investment"
            highlight={outputs.roiYear5 > 0}
          />
          
          <MetricCard
            label="ROI at Year 10"
            value={ROICalculator.formatPercentage(outputs.roiYear10)}
            description="10-year return on investment"
            highlight={outputs.roiYear10 > 50}
          />
        </div>

        {/* Scale Metrics */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Network Scale</h3>
          
          <MetricCard
            label="Total Miles (5Y)"
            value={ROICalculator.formatNumber(outputs.totalNetworkMiles5y)}
            description="Cumulative network miles by year 5"
          />
          
          <MetricCard
            label="Total Miles (10Y)"
            value={ROICalculator.formatNumber(outputs.totalNetworkMiles10y)}
            description="Cumulative network miles by year 10"
          />
        </div>

        {/* Cost Amortization */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">R&D Amortization</h3>
          
          <MetricCard
            label="R&D per Mile (5Y)"
            value={ROICalculator.formatCurrency(outputs.rdAmortizedPerMile5y)}
            description="Fixed investment amortized per mile (5Y)"
          />
          
          <MetricCard
            label="R&D per Mile (10Y)"
            value={ROICalculator.formatCurrency(outputs.rdAmortizedPerMile10y)}
            description="Fixed investment amortized per mile (10Y)"
            highlight={outputs.rdAmortizedPerMile10y < 0.10}
          />
        </div>
      </div>
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string
  description: string
  highlight?: boolean
}

function MetricCard({ label, value, description, highlight = false }: MetricCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${
      highlight 
        ? 'bg-green-50 border-green-200' 
        : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="text-sm font-medium text-gray-700">{label}</h4>
        <span className={`text-lg font-bold ${
          highlight ? 'text-green-700' : 'text-gray-900'
        }`}>
          {value}
        </span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  )
}
