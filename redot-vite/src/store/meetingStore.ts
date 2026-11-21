import { create } from "zustand"

export type Segment = { id: string; text: string; at: number; speaker?: number }
export type Status = "idle" | "starting" | "recording" | "stopping" | "error"

export type MeetingState = {
    status: Status
    segments: Segment[]
    meetingId: string | null        // ✅ track current meeting DB id
    setStatus: (status: Status) => void
    addSegment: (segment: Segment) => void
    setMeetingId: (id: string | null) => void
    reset: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
    status: "idle",
    segments: [],
    meetingId: null,
    setStatus: (status) => set({ status }),
    addSegment: (segment) => set((s) => ({ segments: [...s.segments, segment] })),
    setMeetingId: (id) => set({ meetingId: id }),
    reset: () => set({ segments: [], meetingId: null }),
}))

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