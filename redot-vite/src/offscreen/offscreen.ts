const BACKEND_WS = "ws://127.0.0.1:8000/ws/audio"

let socket: WebSocket | null = null
let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let playback: AudioContext | null = null

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.target !== "offscreen") return false

    if (message.action === "START_RECORDING") {
        startCapture(message.streamId)
            .then(() => sendResponse({ ok: true }))
            .catch((e) => sendResponse({ ok: false, error: String(e?.message ?? e) }))
        return true
    }
    if (message.action === "STOP_RECORDING") {
        stopCapture().then(() => sendResponse({ ok: true }))
        return true
    }
    return false
})

async function startCapture(streamId: string) {
    stream = await navigator.mediaDevices.getUserMedia({
        audio: { mandatory: { chromeMediaSource: "tab", chromeMediaSourceId: streamId } } as any,
        video: false,
    } as MediaStreamConstraints)

    // Keep the meeting audible while it is captured.
    playback = new AudioContext()
    playback.createMediaStreamSource(stream).connect(playback.destination)

    socket = new WebSocket(BACKEND_WS)
    socket.binaryType = "arraybuffer"
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        if (data.type === "transcript" || data.type === "final") {
            chrome.runtime.sendMessage({ target: "background", action: "TRANSCRIPT", payload: data })
        }
    }

    try {
        await new Promise<void>((resolve, reject) => {
            socket!.onopen = () => resolve()
            socket!.onerror = () => reject(new Error("Backend not reachable. Run run_server.py first."))
        })
    } catch (error) {
        await stopCapture()
        throw error
    }

    recorder = new MediaRecorder(stream, { mimeType: "audio/webm" })
    recorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socket?.readyState === WebSocket.OPEN) socket.send(event.data)
    }
    recorder.start(1000)
}

async function stopCapture() {
    if (recorder && recorder.state !== "inactive") recorder.stop()
    stream?.getTracks().forEach((t) => t.stop())
    await playback?.close()
    socket?.close()
    recorder = null
    stream = null
    playback = null
    socket = null
}