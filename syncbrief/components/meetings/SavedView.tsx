import { useState } from "react"
import { Check, Pencil, Plus } from "lucide-react"
import { Badge } from "~components/ui/badge"
import { Button } from "~components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~components/ui/card"

type Props = {
    title: string
    onTitleChange: (title: string) => void
    onNew: () => void
}

export function SavedView({ title, onTitleChange, onNew }: Props) {
    const [editing, setEditing] = useState(false)

    return (
        <div className="flex w-full flex-col gap-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        {editing ? (
                            <input
                                autoFocus
                                value={title}
                                onChange={(e) => onTitleChange(e.target.value)}
                                onBlur={() => setEditing(false)}
                                onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
                                className="flex-1 rounded-md border border-brand-400 bg-white px-2 py-1 text-base font-semibold outline-none ring-2 ring-brand-400/20"
                            />
                        ) : (
                            <CardTitle className="text-base">{title}</CardTitle>
                        )}
                        <button
                            onClick={() => setEditing(true)}
                            className="rounded-md p-1.5 text-stone-400 hover:bg-warm-200 hover:text-stone-900"
                        >
                            <Pencil size={14} />
                        </button>
                    </div>
                    <Badge tone="success" className="w-fit">
                        <Check size={12} /> Saved
                    </Badge>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-stone-600">Your transcript is saved. You can rename it at any time.</p>
                </CardContent>
            </Card>
            <div>
                <Button variant="outline" onClick={onNew}>
                    <Plus size={15} /> New recording
                </Button>
            </div>
        </div>
    )
}