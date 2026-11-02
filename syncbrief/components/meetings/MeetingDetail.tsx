import { useState } from "react"
import { CheckSquare, FileText, Lightbulb, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~components/ui/card"
import { Badge } from "~components/ui/badge"
import { cn } from "~lib/utils"
import { sampleMeetings, type Meeting } from "~data/meetings"

type Tab = "summary" | "decisions" | "tasks" | "transcript"

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "Summary", icon: <FileText size={13} /> },
    { id: "decisions", label: "Decisions", icon: <Lightbulb size={13} /> },
    { id: "tasks", label: "Tasks", icon: <CheckSquare size={13} /> },
    { id: "transcript", label: "Transcript", icon: <MessageSquare size={13} /> },
]

export function MeetingDetail({ meetingId }: { meetingId: string }) {
    const meeting = sampleMeetings.find((m) => m.id === meetingId)
    if (!meeting) return null
    return <MeetingContent key={meeting.id} meeting={meeting} />
}

function MeetingContent({ meeting }: { meeting: Meeting }) {
    const [tab, setTab] = useState<Tab>("summary")

    return (
        <div className="flex w-full flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                    <div className="flex items-center gap-2">
                        <CardDescription>{meeting.date} · {meeting.durationMin} min</CardDescription>
                        <Badge tone="success">Saved</Badge>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex gap-1 rounded-md bg-warm-100 p-1">
                        {tabs.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={cn(
                                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition",
                                    tab === t.id ? "bg-white text-stone-900 shadow-soft" : "text-stone-500 hover:text-stone-900"
                                )}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {tab === "summary" && <SummaryTab text={meeting.summary} />}
                    {tab === "decisions" && <DecisionsTab items={meeting.decisions} />}
                    {tab === "tasks" && <TasksTab items={meeting.actionItems} />}
                    {tab === "transcript" && <TranscriptTab lines={meeting.transcript} />}
                </CardContent>
            </Card>
        </div>
    )
}

function SummaryTab({ text }: { text: string }) {
    return <p className="text-sm leading-relaxed text-stone-700">{text}</p>
}

function DecisionsTab({ items }: { items: string[] }) {
    if (items.length === 0) return <Empty text="No decisions were recorded." />
    return (
        <ul className="space-y-2">
            {items.map((d, i) => (
                <li key={i} className="rounded-md bg-warm-100 px-3 py-2 text-sm text-stone-800">
                    {d}
                </li>
            ))}
        </ul>
    )
}

function TasksTab({ items }: { items: Meeting["actionItems"] }) {
    if (items.length === 0) return <Empty text="No tasks were assigned." />
    return (
        <ul className="space-y-2">
            {items.map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3 rounded-md border border-stone-200 bg-white px-3 py-2.5">
                    <div className="min-w-0">
                        <p className="text-sm text-stone-900">{a.task}</p>
                        <p className="text-[11px] text-stone-400">Owner: {a.owner}</p>
                    </div>
                    {a.due && <Badge tone="brand">{a.due}</Badge>}
                </li>
            ))}
        </ul>
    )
}

function TranscriptTab({ lines }: { lines: string[] }) {
    return (
        <div className="space-y-2">
            {lines.map((line, i) => (
                <div key={i} className="rounded-md bg-warm-100 px-3.5 py-2.5 text-sm leading-relaxed text-stone-800">
                    {line}
                </div>
            ))}
        </div>
    )
}

function Empty({ text }: { text: string }) {
    return <p className="py-6 text-center text-sm text-stone-400">{text}</p>
}