'use client'

import { useState } from 'react'
import { User, Loader2, AlertCircle } from 'lucide-react'
import { useProfileData } from '@/hooks/useProfileData'
import { ParsedCVDisplay } from '@/components/dashboard/ParsedCVDisplay'
import { ProfileEditForm } from '@/components/dashboard/ProfileEditForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ProfilePage() {
  const { profile, parsedCV, isLoading, error, refetch } = useProfileData()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSave = async (data: { fullName: string; jobTitle: string }) => {
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: data.fullName,
          jobTitle: data.jobTitle,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      setSaveSuccess(true)
      await refetch()

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Your Profile
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            View and manage your profile information.
          </p>
        </div>

        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="relative">
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
            Your Profile
          </h1>
          <p className="text-zinc-400 font-body mt-2 text-lg">
            View and manage your profile information.
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive font-medium">Failed to load profile</p>
            <p className="text-sm text-zinc-400 mt-1">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="mt-4 text-accent hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Get initials for avatar
  const initials = profile?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="relative">
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          Your Profile
        </h1>
        <p className="text-zinc-400 font-body mt-2 text-lg">
          View and manage your profile information.
        </p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-300 px-4 py-3 rounded-lg">
          Profile updated successfully!
        </div>
      )}
      {saveError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-lg">
          {saveError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Profile Info + Edit Form */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
            <div className="p-6">
              <h3 className="text-white font-medium text-lg mb-4">Profile Overview</h3>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={profile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-accent/10 text-accent text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg text-white">
                    {profile?.fullName || 'No name set'}
                  </h3>
                  <p className="text-zinc-400">
                    {profile?.jobTitle || 'No job title set'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Skills from Profile */}
          {profile?.skills && profile.skills.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-zinc-900/80 backdrop-blur-md">
              <div className="p-6">
                <h3 className="text-white font-medium text-sm mb-4">Profile Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-accent/10 text-accent border border-accent/20"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Edit Form */}
          <ProfileEditForm
            initialData={{
              fullName: profile?.fullName || null,
              jobTitle: profile?.jobTitle || null,
            }}
            onSave={handleSave}
            isLoading={isSaving}
          />
        </div>

        {/* Right Column: Parsed CV Data */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-white">CV Analysis</h2>
          <ParsedCVDisplay parsedCV={parsedCV} />
        </div>
      </div>
    </div>
  )
}
