'use client'

import { V1Simulator } from '@/components/V1Simulator'
import { ClientOnly } from '@/components/ClientOnly'

export default function Home() {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Autonomy Scale ROI...</p>
        </div>
      </div>
    }>
      <V1Simulator />
    </ClientOnly>
  )
}
