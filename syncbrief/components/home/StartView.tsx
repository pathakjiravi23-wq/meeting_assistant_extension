import { Mic, Plus } from "lucide-react"
import { Button } from "~components/ui/button"

export function StartView({ onStart }: { onStart: () => void }) {
    return (
        <div className="flex h-full w-full flex-col items-center justify-center text-center">
            <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-500">
                <Mic size={24} />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Ready when you are</h2>
            <p className="mt-1 max-w-sm text-sm text-stone-400">
                Open a Google Meet or Zoom call, then start recording to get a live transcript.
            </p>
            <Button size="lg" className="mt-6" onClick={onStart}>
                <Plus size={16} /> Start recording
            </Button>
        </div>
    )
}