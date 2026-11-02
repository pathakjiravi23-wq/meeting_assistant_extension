import { useEffect } from "react"
import { Mic, Square, ExternalLink } from "lucide-react"
import { Button } from "~components/ui/button"
import { Badge } from "~components/ui/badge"
import { useMeetingStore, extStorage } from "~store/meetingStore"
// @ts-expect-error CSS is resolved by the extension bundler, not TypeScript.
import "~style.css"

export default function Popup() {
  const { status, setStatus } = useMeetingStore()

  useEffect(() => {
    extStorage.get("status").then((s) => s && setStatus(s as any))
    const unwatch = extStorage.watch({ status: (c) => setStatus(c.newValue as any) })
    return () => unwatch()
  }, [])

  const isLive = status === "recording"
  const busy = status === "starting" || status === "stopping"

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
        {isLive ? <Badge tone="live" dot>Recording</Badge> : <Badge>Idle</Badge>}
      </div>

      <div className="space-y-2">
        {isLive ? (
          <Button variant="danger" className="w-full" onClick={() => chrome.runtime.sendMessage({ action: "STOP" })} disabled={busy}>
            <Square size={13} className="fill-current" /> Stop meeting
          </Button>
        ) : (
          <Button className="w-full" onClick={() => chrome.runtime.sendMessage({ action: "START" })} disabled={busy}>
            <Mic size={15} /> Start recording
          </Button>
        )}
        <Button variant="outline" className="w-full" onClick={openSidePanel}>
          <ExternalLink size={14} /> Open SyncBrief
        </Button>
      </div>
    </div>
  )
}