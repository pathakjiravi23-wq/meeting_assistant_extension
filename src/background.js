let isRecordingActive = false;
let recordedTabId = null; // Store the specific tab ID being recorded

// 1. Helper function to create offscreen document
async function ensureOffscreenDocument(path) {
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
    });

    if (existingContexts.length > 0) return;

    await chrome.offscreen.createDocument({
        url: path,
        reasons: ['USER_MEDIA'],
        justification: 'Recording meeting audio from the active tab using MediaRecorder',
    });
}

// 2. NEW: Listen for tab closure to stop recording if the meeting tab is closed
chrome.tabs.onRemoved.addListener(async (closedTabId) => {
    if (closedTabId === recordedTabId && isRecordingActive) {
        console.log("Meeting tab was closed by user. Stopping recording...");

        // Stop recording and clean up offscreen document
        chrome.runtime.sendMessage({ action: "STOP_RECORDING" }, async () => {
            try {
                await chrome.offscreen.closeDocument();
            } catch (e) {
                console.log("Offscreen document already closed.");
            }
            isRecordingActive = false;
            recordedTabId = null;
        });
    }
});

// 3. Message listener for Popup and Offscreen
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "START_MEETING") {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const activeTab = tabs[0];

            if (activeTab && (activeTab.url.includes("meet.google.com") || activeTab.url.includes("zoom.us"))) {
                try {
                    // Save the target tab ID
                    recordedTabId = activeTab.id;

                    chrome.tabCapture.getMediaStreamId({ targetTabId: recordedTabId }, async (streamId) => {
                        if (chrome.runtime.lastError) {
                            sendResponse({ status: "Error", message: chrome.runtime.lastError.message });
                            return;
                        }

                        await ensureOffscreenDocument('offscreen.html');

                        chrome.runtime.sendMessage({
                            action: "START_RECORDING",
                            streamId: streamId
                        }, (response) => {
                            isRecordingActive = true;
                            sendResponse({ status: "Success", message: "Audio recording started!" });
                        });
                    });
                } catch (error) {
                    console.error("Capture error:", error);
                    sendResponse({ status: "Error", message: error.message });
                }
            } else {
                sendResponse({ status: "Warning", message: "Please open Google Meet or Zoom." });
            }
        });

        return true;
    }

    else if (request.action === "STOP_MEETING") {
        chrome.runtime.sendMessage({ action: "STOP_RECORDING" }, async (response) => {
            try {
                await chrome.offscreen.closeDocument();
            } catch (e) {
                console.log("Offscreen document already closed.");
            }
            isRecordingActive = false;
            recordedTabId = null;
            sendResponse({ status: "Success", message: "Meeting and recording stopped." });
        });

        return true;
    }

    else if (request.action === "GET_STATUS") {
        sendResponse({ isRecording: isRecordingActive });
    }
});