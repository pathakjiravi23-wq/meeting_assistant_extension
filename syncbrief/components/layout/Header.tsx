import { PanelLeft } from "lucide-react"
import { Badge } from "~components/ui/badge"
import { cn } from "~lib/utils"

type Props = {
    title: string
    subtitle: string
    sidebarOpen: boolean
    onToggleSidebar: () => void
    isLive: boolean
}

export function Header({ title, subtitle, sidebarOpen, onToggleSidebar, isLive }: Props) {
    return (
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 bg-warm-50 px-4 py-4">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onToggleSidebar()
                    }}
                    aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                    className={cn("shrink-0 rounded-md p-1.5 text-stone-500 hover:bg-warm-200 hover:text-stone-900")}
                >
                    <PanelLeft size={18} />
                </button>
                <div className="min-w-0">
                    <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
                    <p className="truncate text-xs text-stone-400">{subtitle}</p>
                </div>
            </div>
            {isLive && <Badge tone="live" dot>Rec</Badge>}
        </header>
    )
}