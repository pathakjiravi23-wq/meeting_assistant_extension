import { Bell, Plus, Puzzle, Sparkles } from "lucide-react"
import { cn } from "~lib/utils"
import { sampleMeetings } from "~data/meetings"
import { NavItem } from "./SidebarItems"
import { ProfileMenu } from "./ProfileMenu"

export type Nav = "meetings" | "plugins" | "updates"

type Props = {
    width: number
    open: boolean
    nav: Nav
    selectedMeetingId: string | null
    onNew: () => void
    onNavigate: (nav: Nav) => void
    onSelectMeeting: (id: string) => void
}

export function Sidebar({
    width,
    open,
    nav,
    selectedMeetingId,
    onNew,
    onNavigate,
    onSelectMeeting,
}: Props) {
    return (
        <aside
            style={{ width }}
            className={cn(
                "absolute inset-y-0 left-0 z-20 flex flex-col border-r border-stone-200 bg-warm-100 transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "-translate-x-full"
            )}
        >
            <div className="flex items-center gap-2 px-4 py-4">
                <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-white">
                    <Sparkles size={15} />
                </div>
                <span className="text-sm font-semibold tracking-tight">SyncBrief</span>
            </div>

            <div className="px-2 pb-2">
                <button
                    onClick={onNew}
                    className="flex w-full items-center gap-2 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-900 shadow-soft transition hover:border-brand-400 hover:text-brand-600"
                >
                    <Plus size={15} className="text-brand-500" /> New
                </button>
            </div>

            <nav className="space-y-1 px-2">
                <NavItem icon={<Puzzle size={15} />} label="Plugins" active={nav === "plugins"} onClick={() => onNavigate("plugins")} />
                <NavItem icon={<Bell size={15} />} label="Updates" active={nav === "updates"} onClick={() => onNavigate("updates")} />
            </nav>

            <div className="mt-5 px-4 text-[11px] font-medium uppercase tracking-wider text-stone-400">Meetings</div>
            <div className="mt-2 flex-1 space-y-0.5 overflow-y-auto px-2">
                {sampleMeetings.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelectMeeting(m.id)}
                        className={cn(
                            "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition",
                            selectedMeetingId === m.id ? "bg-white shadow-soft" : "text-stone-600 hover:bg-warm-200"
                        )}
                    >
                        <span className="truncate">{m.title}</span>
                        <span className="shrink-0 text-[11px] text-stone-400">{m.durationMin}m</span>
                    </button>
                ))}
                <button className="w-full px-3 py-1.5 text-left text-xs text-brand-600 hover:underline">See more</button>
            </div>

            <ProfileMenu />
        </aside>
    )
}