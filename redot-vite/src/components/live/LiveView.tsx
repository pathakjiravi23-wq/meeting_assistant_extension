import { Loader2, Square } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Segment = { id: string; text: string; at: number }

type Props = {
    segments: Segment[]
    saving: boolean
    onStop: () => void
}

export function LiveView({ segments, saving, onStop }: Props) {
    return (
        <div className="flex h-full w-full flex-col gap-4">
            <Card className="flex flex-1 flex-col overflow-hidden">
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Live transcript</CardTitle>
                        <CardDescription>{saving ? "Saving transcript…" : "Streaming while the meeting runs"}</CardDescription>
                    </div>
                    {!saving && <Badge tone="live" dot>Recording</Badge>}
                </CardHeader>
                <CardContent className="flex-1 space-y-3 overflow-y-auto">
                    {segments.length === 0 && (
                        <p className="py-10 text-center text-sm text-stone-400">Listening for speech…</p>
                    )}
                    {segments.map((s) => (
                        <div key={s.id} className="rounded-md bg-warm-100 px-3.5 py-2.5 text-sm leading-relaxed text-stone-900">
                            {s.text}
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-stone-400">Let participants know this meeting is being transcribed.</p>
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