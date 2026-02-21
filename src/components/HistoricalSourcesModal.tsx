'use client'

import { useState } from 'react'
import { X, ExternalLink } from 'lucide-react'
import { WAYMO_PUBLIC_ANCHORS, HistoricalAnchor } from '@/lib/historical-anchors'

interface HistoricalSourcesModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HistoricalSourcesModal({ isOpen, onClose }: HistoricalSourcesModalProps) {
  if (!isOpen) return null

  // Group anchors by year for clean display
  const anchorsByYear = WAYMO_PUBLIC_ANCHORS.reduce((acc, anchor) => {
    const year = anchor.year
    if (!acc[year]) acc[year] = []
    acc[year].push(anchor)
    return acc
  }, {} as Record<number, HistoricalAnchor[]>)

  const formatValue = (anchor: HistoricalAnchor) => {
    if (anchor.value >= 1000000) {
      return `${(anchor.value / 1000000).toFixed(1)}M`
    }
    if (anchor.value >= 1000) {
      return `${(anchor.value / 1000).toFixed(0)}k`
    }
    return anchor.value.toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Historical Data Sources</h2>
            <p className="text-sm text-gray-600 mt-1">Waymo public reporting anchors</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-6">
            {Object.entries(anchorsByYear)
              .sort(([a], [b]) => parseInt(b) - parseInt(a)) // Most recent first
              .map(([year, anchors]) => (
                <div key={year} className="border-l-2 border-blue-100 pl-4">
                  <h3 className="font-medium text-gray-900 mb-3">{year}</h3>
                  <div className="space-y-3">
                    {anchors.map((anchor, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 mb-1">
                              {formatValue(anchor)} {anchor.unit}
                            </div>
                            <div className="text-sm text-gray-600 mb-2">
                              {anchor.source.title}
                            </div>
                            <div className="text-xs text-gray-500">
                              {anchor.source.publisher} • {anchor.source.date}
                            </div>
                          </div>
                          <a
                            href={anchor.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-3 flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          >
                            <span>Open</span>
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {/* Footer note */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Data integrity:</strong> All historical anchors are sourced from official Waymo communications and verified third-party reporting. 
              Simulation projections beyond {new Date().getFullYear()} are modeled estimates based on these established trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
