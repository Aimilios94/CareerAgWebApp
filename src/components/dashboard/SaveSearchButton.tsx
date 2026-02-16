'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useSaveSearch } from '@/hooks/useSavedSearches'

interface SaveSearchButtonProps {
  searchId: string
  query: string
  onSaved?: () => void
}

export function SaveSearchButton({ searchId, query, onSaved }: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(query)
  const { mutateAsync: saveSearch, isPending } = useSaveSearch()

  const handleSave = async () => {
    await saveSearch({ searchId, name })
    setOpen(false)
    onSaved?.()
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setName(query)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" aria-label="Save search" className="text-zinc-400 hover:text-white">
          <Bookmark className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name this search..."
          />
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isPending || !name.trim()}>
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
