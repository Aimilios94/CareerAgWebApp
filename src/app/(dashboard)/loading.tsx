export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-9 w-64 bg-zinc-800 rounded-lg animate-pulse" />
        <div className="h-5 w-96 bg-zinc-800/60 rounded-lg animate-pulse" />
      </div>

      {/* Card skeleton - mirrors CareerProfileSkeleton */}
      <div className="rounded-2xl border border-white/5 bg-zinc-900/40 overflow-hidden animate-pulse">
        <div className="grid md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-8 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-white/5 rounded" />
                <div className="h-3 w-32 bg-white/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grid skeleton - mirrors MatchGridSkeleton */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-zinc-900/50 p-6 animate-pulse">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="w-16 h-16 rounded-full bg-white/5" />
              <div className="w-16 h-6 bg-white/5 rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-5 w-3/4 bg-white/5 rounded" />
              <div className="h-4 w-1/2 bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
