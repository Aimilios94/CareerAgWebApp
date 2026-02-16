import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { motion, HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-heading font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-accent-orange text-white hover:bg-opacity-90 shadow-sm',
        secondary:
          'bg-brand-light-gray text-brand-dark hover:bg-brand-mid-gray/20',
        outline:
          'border border-brand-light-gray bg-transparent hover:bg-brand-light-gray text-brand-dark',
        ghost: 'hover:bg-brand-light-gray text-brand-dark',
        link: 'text-accent-orange underline-offset-4 hover:underline',
        destructive:
          'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        xl: 'h-14 px-8 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : motion.button
    const MotionComp = Comp as any // Type assertion for Slot/Motion compatibility

    const motionProps = !asChild ? {
      whileHover: { scale: 1.02 },
      whileTap: { scale: 0.98 },
      transition: { type: "spring", stiffness: 400, damping: 25 }
    } : {}

    return (
      <MotionComp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...motionProps}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{children}</span>
          </div>
        ) : (
          children
        )}
      </MotionComp>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
