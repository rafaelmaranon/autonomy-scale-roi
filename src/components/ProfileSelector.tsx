'use client'

import { ProfileConfig } from '@/lib/profiles'

interface ProfileSelectorProps {
  profiles: ProfileConfig[]
  selectedProfile: string
  onProfileChange: (profileName: string) => void
  showPresetLoaded?: boolean
}

export function ProfileSelector({ 
  profiles, 
  selectedProfile, 
  onProfileChange, 
  showPresetLoaded = false 
}: ProfileSelectorProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Profile</label>
        {showPresetLoaded && selectedProfile !== 'Custom' && (
          <span className="text-xs text-green-600">Preset loaded — you can override</span>
        )}
      </div>
      
      <div className="flex space-x-1">
        {profiles.map((profile) => (
          <button
            key={profile.name}
            onClick={() => onProfileChange(profile.name)}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedProfile === profile.name
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {profile.name}
          </button>
        ))}
      </div>
      
      {/* Profile description */}
      <div className="mt-2">
        <p className="text-xs text-gray-600">
          {profiles.find(p => p.name === selectedProfile)?.description}
        </p>
      </div>
    </div>
  )
}
