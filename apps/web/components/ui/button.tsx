import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'outline' | 'secondary'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus-ring disabled:opacity-50 disabled:pointer-events-none"
    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 shadow-sm",
      secondary: "bg-lahasa-600 text-white hover:bg-lahasa-700 shadow-sm",
      outline: "border border-slate-200 bg-white hover:bg-slate-50",
      ghost: "hover:bg-slate-100"
    }
    const sizes = {
      sm: "h-9 px-3 text-sm",
      md: "h-11 px-5 text-[15px]",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10"
    }
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    )
  }
)
Button.displayName = 'Button'
