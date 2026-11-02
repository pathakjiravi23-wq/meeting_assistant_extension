import { cn } from "~lib/utils"

type Tone = "neutral" | "brand" | "live" | "success"

const tones: Record<Tone, string> = {
    neutral: "bg-warm-200 text-stone-600 border-stone-200",
    brand: "bg-brand-50 text-brand-600 border-brand-400/30",
    live: "bg-red-50 text-red-600 border-red-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

export function Badge({
    tone = "neutral",
    dot = false,
    className,
    children,
}: {
    tone?: Tone
    dot?: boolean
    className?: string
    children: React.ReactNode
}) {
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                tones[tone],
                className
            )}
        >
            {dot && (
                <span
                    className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        tone === "live" ? "bg-red-500 animate-pulse-dot" : "bg-current"
                    )}
                />
            )}
            {children}
        </span>
    )
}