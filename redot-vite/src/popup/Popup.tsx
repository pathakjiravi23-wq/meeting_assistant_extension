import { useEffect, useState } from "react"
import { Mic, Square, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useMeetingStore, extStorage } from "@/store/meetingStore"

export default function Popup() {
    const { status, setStatus } = useMeetingStore()
    const [error, setError] = useState<string | null>(null)
    const [pending, setPending] = useState(false)

    useEffect(() => {
        extStorage.get<string>("status").then((s) => s && setStatus(s as any))
        extStorage.get<string>("error").then((e) => setError(e ?? null))
        const unwatch = extStorage.watch({
            status: (c) => setStatus(c.newValue as any),
            error: (c) => setError((c.newValue as string) ?? null),
        })
        return () => unwatch()
    }, [])

    const isLive = status === "recording"
    const busy = pending || status === "starting" || status === "stopping"

    const send = (action: "START" | "STOP") => {
        setPending(true)
        setError(null)
        chrome.runtime.sendMessage({ action }, (reply) => {
            setPending(false)
            if (chrome.runtime.lastError) {
                setError(chrome.runtime.lastError.message ?? "Could not reach SyncBrief.")
                return
            }
            if (reply && reply.ok === false) setError(reply.error ?? "Something went wrong.")
        })
    }

    const openSidePanel = async () => {
        const win = await chrome.windows.getCurrent()
        // @ts-ignore: sidePanel is available in Chrome 114+
        await chrome.sidePanel.open({ windowId: win.id })
    }

    return (
        <div className="w-[300px] bg-warm-50 p-4">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="grid h-7 w-7 place-items-center rounded-md bg-brand-500 text-white">
                        <Mic size={14} />
                    </div>
                    <span className="text-sm font-semibold tracking-tight">SyncBrief</span>
                </div>
                {isLive ? <Badge tone="live" dot>Recording</Badge> : <Badge>{busy ? "Working…" : "Idle"}</Badge>}
            </div>

            {error && (
                <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                {isLive ? (
                    <Button variant="danger" className="w-full" onClick={() => send("STOP")} disabled={busy}>
                        <Square size={13} className="fill-current" /> Stop meeting
                    </Button>
                ) : (
                    <Button className="w-full" onClick={() => send("START")} disabled={busy}>
                        <Mic size={15} /> {busy ? "Starting…" : "Start recording"}
                    </Button>
                )}
                <Button variant="outline" className="w-full" onClick={openSidePanel}>
                    <ExternalLink size={14} /> Open SyncBrief
                </Button>
            </div>
        </div>
    )
}