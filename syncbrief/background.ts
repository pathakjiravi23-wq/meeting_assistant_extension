import { Storage } from "@plasmohq/storage"

const storage = new Storage({ area: "local" })

type Message = { action: "START" } | { action: "STOP" }

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
    if (message.action === "START") {
        startRecording().then(sendResponse)
    } else if (message.action === "STOP") {
        stopRecording().then(sendResponse)
    }
    return true // keep the channel open for the async reply
})

async function startRecording() {
    const current = await storage.get<string>("status")
    if (current === "recording" || current === "starting") {
        return { ok: true }
    }

    await storage.set("status", "starting")
    await storage.remove("error")

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        const url = tab?.url ?? ""
        if (!tab?.id || !/meet\.google\.com|zoom\.us|youtube\.com/.test(url)) {
            throw new Error("Open Google Meet or Zoom first.")
        }

        const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id })
        await ensureOffscreenDocument()
        await chrome.runtime.sendMessage({
            target: "offscreen",
            action: "START_RECORDING",
            streamId,
        })

        await storage.set("status", "recording")
        return { ok: true }
    } catch (error) {
        const message = (error as Error).message
        await storage.set("status", "error")
        await storage.set("error", message)
        return { ok: false, error: message }
    }
}

async function stopRecording() {
    await storage.set("status", "stopping")
    await chrome.runtime.sendMessage({ target: "offscreen", action: "STOP_RECORDING" })
    await storage.set("status", "idle")
    return { ok: true }
}

async function ensureOffscreenDocument() {
    const contexts = await chrome.runtime.getContexts({
        contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
    })
    if (contexts.length === 0) {
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: [chrome.offscreen.Reason.USER_MEDIA],
            justification: "Record tab audio for transcription",
        })
    }
}