export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-noise opacity-[0.03]" />
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {children}
      </div>
    </div>
  )
}
