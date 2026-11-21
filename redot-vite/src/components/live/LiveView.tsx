import { useEffect, useRef } from "react"
import { Loader2, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Segment = { id: string; text: string; at: number; speaker?: number }

type Props = {
    segments: Segment[]
    saving: boolean
    onStop: () => void
    transcriptError?: string | null
}

// ✅ Speaker colors — cycles through for each speaker index
const SPEAKER_COLORS = [
    "bg-blue-50 border-blue-200",
    "bg-green-50 border-green-200",
    "bg-purple-50 border-purple-200",
    "bg-orange-50 border-orange-200",
    "bg-pink-50 border-pink-200",
]

export function LiveView({ segments, saving, onStop, transcriptError }: Props) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // ✅ Auto-scroll to latest segment
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [segments])

    return (
        <div className="flex h-full w-full flex-col gap-4">
            <Card className="flex flex-1 flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Live transcript</CardTitle>
                        <CardDescription>
                            {saving ? "Saving transcript…" : "Streaming while the meeting runs"}
                        </CardDescription>
                    </div>
                    {!saving && <Badge tone="live" dot>Recording</Badge>}
                </CardHeader>
                <CardContent className="flex-1 space-y-3 overflow-y-auto">
                    {transcriptError && (
                        <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                            ⚠ {transcriptError}
                        </div>
                    )}
                    {segments.length === 0 && !transcriptError && (
                        <p className="py-10 text-center text-sm text-stone-400">Listening for speech…</p>
                    )}
                    {segments.map((s) => (
                        <div
                            key={s.id}
                            className={`rounded-md border px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 ${SPEAKER_COLORS[(s.speaker ?? 0) % SPEAKER_COLORS.length]}`}
                        >
                            {/* ✅ Show speaker label */}
                            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                                Speaker {s.speaker ?? 0}
                            </span>
                            {s.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-stone-400">
                    {transcriptError
                        ? "Stop and restart recording to reconnect."
                        : "Let participants know this meeting is being transcribed."}
                </p>
                {saving ? (
                    <Button variant="outline" disabled>
                        <Loader2 size={15} className="animate-spin" /> Saving
                    </Button>
                ) : (
                    <Button variant="danger" onClick={onStop}>
                        <Square size={13} className="fill-current" /> Stop meeting
                    </Button>
                )}
            </div>
        </div>
    )
}