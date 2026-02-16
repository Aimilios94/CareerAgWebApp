import { cn } from "@/lib/utils"

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-white/5 relative overflow-hidden", className)}
            {...props}
        >
            <div className="absolute inset-0 skeleton-shimmer opacity-50" />
        </div>
    )
}

export { Skeleton }
