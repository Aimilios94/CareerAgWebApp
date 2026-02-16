'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Target,
  LayoutDashboard,
  Search,
  History,
  Bookmark,
  FileSearch,
  User,
  Crown,
  Menu,
  X,
  TrendingUp,
  Bell,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Jobs', href: '/dashboard/jobs', icon: Search },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Saved', href: '/dashboard/saved-searches', icon: Bookmark },
  { name: 'CV Analysis', href: '/dashboard/cv-analysis', icon: FileSearch },
  { name: 'Trending', href: '/dashboard/trending', icon: TrendingUp },
  { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Pro', href: '/dashboard/pro', icon: Crown },
]

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold text-lg text-white">
              Career Agent
            </span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-3 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden fixed top-16 left-0 right-0 z-50 bg-zinc-950/98 backdrop-blur-sm border-b border-white/5 transform transition-transform duration-200',
          isOpen ? 'translate-y-0' : '-translate-y-full'
        )}
      >
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-body text-base transition-all',
                  isActive
                    ? 'bg-accent/10 text-accent font-medium'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
                {item.name === 'Pro' && (
                  <span className="ml-auto text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-t border-white/5">
        <div className="flex items-center justify-around h-16">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors',
                  isActive ? 'text-accent' : 'text-zinc-500'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-body">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
