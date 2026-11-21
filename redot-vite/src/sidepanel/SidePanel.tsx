import { useEffect, useState, useRef, useCallback } from "react"
import { useMeetingStore, extStorage } from "@/store/meetingStore"
import { Sidebar, type Nav } from "@/components/sidebar/Sidebar"
import { Header } from "@/components/layout/Header"
import { StartView } from "@/components/home/StartView"
import { LiveView } from "@/components/live/LiveView"
import { MeetingDetail } from "@/components/meetings/MeetingDetail"
import { SavedView } from "@/components/meetings/SavedView"

const SIDEBAR_WIDTH = 208

export default function SidePanel() {
    const { status, segments, setStatus } = useMeetingStore()

    const [nav, setNav] = useState<Nav>("meetings")
    const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null)
    const [showNewPage, setShowNewPage] = useState(false)
    const [savedTitle, setSavedTitle] = useState<string | null>(null)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [transcriptError, setTranscriptError] = useState<string | null>(null)

    const prevStatus = useRef<string | null>(null)

    // ✅ Re-read all storage on focus — fixes popup↔sidebar desync
    const syncFromStorage = useCallback(async () => {
        const s = await extStorage.get<string>("status")
        if (s) setStatus(s as any)
        const e = await extStorage.get<string>("transcriptError")
        setTranscriptError(e ?? null)
    }, [setStatus])

    useEffect(() => {
        // Initial read
        syncFromStorage()

        // ✅ Re-sync when sidebar gets focus (user switches to it)
        window.addEventListener("focus", syncFromStorage)
        return () => window.removeEventListener("focus", syncFromStorage)
    }, [syncFromStorage])

    useEffect(() => {
        const unwatch = extStorage.watch({
            status: (c) => setStatus(c.newValue as any),
            transcriptError: (c) => setTranscriptError(c.newValue ?? null),
        })
        return () => unwatch()
    }, [setStatus])

    useEffect(() => {
        if (status === "recording" && prevStatus.current !== "recording") {
            useMeetingStore.getState().reset()
            setSavedTitle(null)
            setShowNewPage(false)
            setTranscriptError(null)
            chrome.storage.local.remove("transcriptError")
        }
        prevStatus.current = status
    }, [status])

    // ✅ Transcript sync with speaker support
    useEffect(() => {
        const sync = (list: any[] = []) => {
            const store = useMeetingStore.getState()
            const seen = new Set(store.segments.map((s) => s.id))
            for (const item of list) {
                if (item?.text && !seen.has(item.segment_id)) {
                    seen.add(item.segment_id)
                    store.addSegment({
                        id: item.segment_id ?? crypto.randomUUID(),
                        text: item.text,
                        at: Date.now(),
                        speaker: item.speaker ?? 0,
                    })
                }
            }
        }

        chrome.storage.local.get("transcripts", (r: Record<string, any>) => sync(r.transcripts ?? []))
        const listener = (changes: any, area: string) => {
            if (area === "local" && changes.transcripts) sync(changes.transcripts.newValue ?? [])
        }
        chrome.storage.onChanged.addListener(listener)
        return () => chrome.storage.onChanged.removeListener(listener)
    }, [])

    const isLive = status === "recording"
    const isSaving = status === "stopping"
    const isSaved = !isLive && !isSaving && savedTitle !== null

    const send = (action: "START" | "STOP") => chrome.runtime.sendMessage({ action })

    const onStop = () => {
        send("STOP")
        setSavedTitle(`Meeting · ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "2-digit" })}`)
    }

    const openNew = () => {
        setNav("meetings")
        setSelectedMeetingId(null)
        setSavedTitle(null)
        setShowNewPage(true)
    }

    const selectMeeting = (id: string) => {
        setNav("meetings")
        setShowNewPage(false)
        setSavedTitle(null)
        setSelectedMeetingId(id)
    }

    const navigate = (next: Nav) => {
        setNav(next)
        setShowNewPage(false)
    }

    const headerTitle = showNewPage
        ? "New meeting"
        : nav === "meetings" ? "Meetings" : nav === "plugins" ? "Plugins" : "Updates"

    const renderMain = () => {
        if (isLive || isSaving) return (
            <LiveView
                segments={segments}
                saving={isSaving}
                onStop={onStop}
                transcriptError={transcriptError}
            />
        )
        if (isSaved && savedTitle) return <SavedView title={savedTitle} onTitleChange={setSavedTitle} onNew={openNew} />
        if (selectedMeetingId && !showNewPage) return <MeetingDetail meetingId={selectedMeetingId} />
        return <StartView onStart={() => send("START")} />
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-warm-50">
            <Sidebar
                width={SIDEBAR_WIDTH}
                open={sidebarOpen}
                nav={nav}
                selectedMeetingId={selectedMeetingId}
                onNew={openNew}
                onNavigate={navigate}
                onSelectMeeting={selectMeeting}
            />
            <main
                onClick={() => sidebarOpen && setSidebarOpen(false)}
                style={{ transform: sidebarOpen ? `translateX(${SIDEBAR_WIDTH}px)` : "translateX(0)" }}
                className="absolute inset-y-0 left-0 flex w-full flex-col bg-warm-50 transition-transform duration-300 ease-out"
            >
                <Header
                    title={headerTitle}
                    subtitle={isLive ? "Capturing tab audio" : "Start a recording from Google Meet or Zoom"}
                    sidebarOpen={sidebarOpen}
                    onToggleSidebar={() => setSidebarOpen((o) => !o)}
                    isLive={isLive}
                />
                <div className="flex-1 overflow-y-auto p-6">{renderMain()}</div>
            </main>
        </div>
    )
}