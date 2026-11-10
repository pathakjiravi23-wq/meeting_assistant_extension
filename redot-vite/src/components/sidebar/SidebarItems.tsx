import * as React from "react"
import { cn } from "@/lib/utils"

export function NavItem({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode
    label: string
    active: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
                active ? "bg-white font-medium text-stone-900 shadow-soft" : "text-stone-600 hover:bg-warm-200"
            )}
        >
            <span className={active ? "text-brand-500" : "text-stone-400"}>{icon}</span>
            {label}
        </button>
    )
}

export function MenuItem({
    icon,
    label,
    highlight,
}: {
    icon: React.ReactNode
    label: string
    highlight?: boolean
}) {
    return (
        <button
            className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm hover:bg-warm-200",
                highlight ? "text-brand-600" : "text-stone-700"
            )}
        >
            {icon}
            {label}
        </button>
    )
}