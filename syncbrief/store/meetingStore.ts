import { create } from "zustand"
import { Storage } from "@plasmohq/storage"

export type Segment = { id: string; text: string; at: number }
export type Status = "idle" | "starting" | "recording" | "stopping" | "error"

export type MeetingState = {
    status: Status
    sessionId: string | null
    segments: Segment[]
    error: string | null
    setStatus: (status: Status) => void
    addSegment: (segment: Segment) => void
    reset: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
    status: "idle",
    sessionId: null,
    segments: [],
    error: null,
    setStatus: (status) => set({ status }),
    addSegment: (segment) => set((s) => ({ segments: [...s.segments, segment] })),
    reset: () => set({ segments: [], error: null, sessionId: null }),
}))

// Shared chrome.storage wrapper. Background writes "status" and "error";
// popup and side panel read and watch them.
export const extStorage = new Storage({ area: "local" })