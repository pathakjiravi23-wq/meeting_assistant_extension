import * as React from "react"
import { cn } from "@/lib/utils"

type Variant = "primary" | "outline" | "ghost" | "danger"
type Size = "sm" | "md" | "lg"

const variants: Record<Variant, string> = {
    primary: "bg-brand-500 text-white shadow-soft hover:bg-brand-600",
    outline: "border border-stone-200 bg-white text-stone-900 hover:bg-warm-200",
    ghost: "text-stone-600 hover:bg-warm-200 hover:text-stone-900",
    danger: "border border-red-200 bg-white text-red-600 hover:bg-red-50",
}

const sizes: Record<Size, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-11 px-6 text-sm",
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant
    size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => (
        <button
            ref={ref}
            className={cn(
                "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        />
    )
)
Button.displayName = "Button"