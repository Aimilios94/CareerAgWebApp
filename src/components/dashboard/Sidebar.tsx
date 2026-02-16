'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Target,
  LayoutDashboard,
  Search,
  History,
  Bookmark,
  FileSearch,
  TrendingUp,
  Bell,
  Crown,
  User,
  LogOut,
  ChevronRight,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Job Search', href: '/dashboard/jobs', icon: Search },
  { name: 'History', href: '/dashboard/history', icon: History },
  { name: 'Saved Searches', href: '/dashboard/saved-searches', icon: Bookmark },
  { name: 'CV Analysis', href: '/dashboard/cv-analysis', icon: FileSearch },
  { name: 'Skills Trending', href: '/dashboard/trending', icon: TrendingUp },
  { name: 'Job Alerts', href: '/dashboard/alerts', icon: Bell },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
]

const proFeatures = [
  { name: 'Action Center', href: '/dashboard/pro', icon: Crown },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, profile, subscription, signOut, loading, isPro } = useAuth()

  // Get user initials
  const getInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return '?'
  }

  // Get display name
  const getDisplayName = () => {
    if (profile?.full_name) {
      return profile.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Get plan label
  const getPlanLabel = () => {
    if (isPro || subscription?.plan_type === 'pro') {
      return 'Pro Member'
    }
    return 'Free Plan'
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-background/95 border-r border-white/5 shadow-2xl z-50">
      {/* Texture Overlay */}
      <div className="absolute inset-0 bg-noise opacity-50 pointer-events-none" />

      {/* Logo */}
      <div className="relative flex items-center gap-3 px-6 h-20 border-b border-white/5">
        <div className="relative group">
          <div className="absolute inset-0 bg-accent/20 blur-lg rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
          <div className="relative w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 border border-white/10">
            <Target className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="font-heading font-bold text-xl text-white tracking-tight">
            Career Agent
          </span>
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
            {isPro ? 'Pro Edition' : 'Free Edition'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 px-4 py-8 space-y-1 overflow-y-auto no-scrollbar">
        <p className="px-3 text-xs font-semibold text-white/30 uppercase tracking-widest mb-4 font-heading">
          Main Menu
        </p>

        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3 rounded-xl font-body text-sm transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'text-white font-medium bg-white/5 shadow-inner border border-white/5'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-accent rounded-r-full shadow-glow-accent animate-fadeIn" />
                )}
                <item.icon className={cn(
                  "w-5 h-5 transition-colors duration-300",
                  isActive ? "text-accent" : "text-zinc-400 group-hover:text-zinc-200"
                )} />
                <span className="relative z-10">{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-white/20 animate-fadeIn" />
                )}
              </Link>
            )
          })}
        </div>

        {/* Pro Section */}
        <div className="mt-8 pt-6 border-t border-white/5">
          <p className="px-3 text-xs font-semibold text-accent/50 uppercase tracking-widest mb-4 font-heading flex items-center gap-2">
            Pro Features <Crown className="w-3 h-3" />
          </p>
          {proFeatures.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 px-3 py-3 rounded-xl font-body text-sm transition-all duration-300',
                  isActive
                    ? 'bg-gradient-to-r from-accent/20 to-transparent text-accent font-medium'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5",
                  isActive ? "text-accent" : "text-amber-500/70"
                )} />
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User section */}
      <div className="relative p-6 border-t border-white/5 bg-black/20">
        {loading ? (
          <div className="flex items-center justify-center p-3">
            <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
          </div>
        ) : (
          <div
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
            onClick={signOut}
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white font-bold ring-2 ring-transparent group-hover:ring-white/20 transition-all">
              {getInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-medium text-sm text-white truncate">
                {getDisplayName()}
              </p>
              <p className="text-xs text-zinc-400 truncate group-hover:text-zinc-300 transition-colors">
                {getPlanLabel()}
              </p>
            </div>
            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
          </div>
        )}
      </div>
    </aside>
  )
}
