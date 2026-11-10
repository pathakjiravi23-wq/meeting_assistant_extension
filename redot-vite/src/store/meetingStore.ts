import { create } from "zustand"

export type Segment = { id: string; text: string; at: number }
export type Status = "idle" | "starting" | "recording" | "stopping" | "error"

export type MeetingState = {
    status: Status
    segments: Segment[]
    setStatus: (status: Status) => void
    addSegment: (segment: Segment) => void
    reset: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
    status: "idle",
    segments: [],
    setStatus: (status) => set({ status }),
    addSegment: (segment) => set((s) => ({ segments: [...s.segments, segment] })),
    reset: () => set({ segments: [] }),
}))

// Small helpers over chrome.storage.local, replacing @plasmohq/storage.
export const extStorage = {
    get: async <T = unknown>(key: string): Promise<T | undefined> =>
        (await chrome.storage.local.get(key))[key] as T | undefined,
    set: (key: string, value: unknown) => chrome.storage.local.set({ [key]: value }),
    remove: (key: string) => chrome.storage.local.remove(key),
    watch: (callbacks: Record<string, (change: { newValue: any }) => void>) => {
        const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
            if (area !== "local") return
            for (const key of Object.keys(callbacks)) {
                if (key in changes) callbacks[key]({ newValue: changes[key].newValue })
            }
        }
        chrome.storage.onChanged.addListener(listener)
        return () => chrome.storage.onChanged.removeListener(listener)
    },
}