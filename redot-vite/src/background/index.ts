const OFFSCREEN_URL = "src/offscreen/index.html"
const MEETING_PATTERN = /meet\.google\.com|zoom\.us|youtube\.com/

const get = async <T = unknown>(key: string) =>
    (await chrome.storage.local.get(key))[key] as T | undefined
const set = (key: string, value: unknown) => chrome.storage.local.set({ [key]: value })

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target === "background" && message.action === "TRANSCRIPT") {
        appendTranscript(message.payload)
        return false
    }
    if (message.target === "offscreen") return false

    if (message.action === "START") {
        startRecording().then(sendResponse)
        return true
    }
    if (message.action === "STOP") {
        stopRecording().then(sendResponse)
        return true
    }
    return false
})

async function findMeetingTab() {
    const windows = await chrome.windows.getAll({ populate: true, windowTypes: ["normal"] })
    const focused = windows.find((w) => w.focused) ?? windows[0]
    const active = focused?.tabs?.find((t) => t.active)
    if (active?.id && MEETING_PATTERN.test(active.url ?? "")) return active

    for (const w of windows) {
        const tab = w.tabs?.find((t) => t.url && MEETING_PATTERN.test(t.url))
        if (tab?.id) return tab
    }
    return null
}

async function startRecording() {
    if (["recording", "starting"].includes((await get<string>("status")) ?? "")) {
        return { ok: true }
    }
    await chrome.storage.local.remove("error")
    await set("status", "starting")
    await chrome.storage.local.remove("transcripts")
    try {
        const tab = await findMeetingTab()
        if (!tab?.id) throw new Error("No Google Meet, Zoom or YouTube tab found. Open one and try again.")

        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id })
        await ensureOffscreen()

        const reply = await chrome.runtime.sendMessage({
            target: "offscreen",
            action: "START_RECORDING",
            streamId,
        })
        if (!reply?.ok) throw new Error(reply?.error ?? "Capture failed")

        await set("status", "recording")
        return { ok: true }
    } catch (error) {
        const message = (error as Error).message
        await set("status", "error")
        await set("error", message)
        return { ok: false, error: message }
    }
}

async function stopRecording() {
    await set("status", "stopping")
    try {
        await chrome.runtime.sendMessage({ target: "offscreen", action: "STOP_RECORDING" })
    } catch {
        // offscreen page already closed
    }
    await chrome.offscreen.closeDocument().catch(() => { })
    await set("status", "idle")
    return { ok: true }
}

async function ensureOffscreen() {
    if (!(await chrome.offscreen.hasDocument())) {
        await chrome.offscreen.createDocument({
            url: OFFSCREEN_URL,
            reasons: [chrome.offscreen.Reason.USER_MEDIA],
            justification: "Capture meeting tab audio for transcription",
        })
    }
}

let transcriptQueue: Promise<void> = Promise.resolve()

function appendTranscript(payload: unknown) {
    transcriptQueue = transcriptQueue.then(async () => {
        const list = (await get<unknown[]>("transcripts")) ?? []
        await set("transcripts", [...list, payload])
    }).catch((e) => console.error("appendTranscript failed", e))
    return transcriptQueue
}