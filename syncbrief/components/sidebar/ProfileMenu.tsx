import { useState } from "react"
import { Check, ChevronDown, LogOut, Settings, Sparkles } from "lucide-react"
import { MenuItem } from "./SidebarItems"

export function ProfileMenu() {
    const [open, setOpen] = useState(false)

    return (
        <div className="relative border-t border-stone-200 p-3">
            {open && (
                <div className="absolute bottom-16 left-3 w-44 rounded-lg border border-stone-200 bg-white p-1 shadow-soft">
                    <MenuItem icon={<Sparkles size={14} />} label="Upgrade" highlight />
                    <MenuItem icon={<Check size={14} />} label="Profile" />
                    <MenuItem icon={<Settings size={14} />} label="Settings" />
                    <div className="my-1 h-px bg-stone-200" />
                    <MenuItem icon={<LogOut size={14} />} label="Sign out" />
                </div>
            )}
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-warm-200"
            >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                    G
                </div>
                <div className="min-w-0 text-left">
                    <div className="text-sm font-medium">Guest</div>
                    <div className="text-[11px] text-stone-400">Free plan</div>
                </div>
                <ChevronDown size={14} className="ml-auto shrink-0 text-stone-400" />
            </button>
        </div>
    )
}