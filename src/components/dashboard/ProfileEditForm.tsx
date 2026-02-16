'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProfileEditFormProps {
  initialData: {
    fullName: string | null
    jobTitle: string | null
  }
  onSave: (data: { fullName: string; jobTitle: string }) => Promise<void>
  isLoading?: boolean
}

export function ProfileEditForm({ initialData, onSave, isLoading = false }: ProfileEditFormProps) {
  const [fullName, setFullName] = useState(initialData.fullName ?? '')
  const [jobTitle, setJobTitle] = useState(initialData.jobTitle ?? '')

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Don't submit if fullName is empty
    if (!fullName.trim()) {
      return
    }

    await onSave({
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="jobTitle" className="text-sm font-medium">
              Job Title
            </label>
            <Input
              id="jobTitle"
              name="jobTitle"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Enter your job title"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
