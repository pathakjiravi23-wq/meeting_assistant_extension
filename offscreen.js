chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.action === "START_RECORDING") {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    mandatory: {
                        chromeMediaSource: 'tab',
                        chromeMediaSourceId: message.streamId
                    }
                },
                video: false
            });

            window.mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
            window.recordedChunks = [];

            // This event triggers periodically based on the timeslice passed to start()
            window.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    window.recordedChunks.push(event.data);
                    // NEW LOG: This will print every second while recording!
                    console.log("Audio chunk captured! Chunk size:", event.data.size);
                }
            };

            window.mediaRecorder.onstop = () => {
                const blob = new Blob(window.recordedChunks, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(blob);
                console.log("Recording stopped successfully! Final Audio Blob URL:", audioUrl);
            };

            // Pass 1000 ms (1 second) so ondataavailable triggers continuously
            window.mediaRecorder.start(1000);
            console.log("MediaRecorder started and actively listening to tab audio...");
            sendResponse({ status: "Recording started successfully" });
        } catch (error) {
            console.error("Error starting MediaRecorder:", error);
            sendResponse({ status: "Error", error: error.message });
        }
    }

    else if (message.action === "STOP_RECORDING") {
        if (window.mediaRecorder && window.mediaRecorder.state !== "inactive") {
            window.mediaRecorder.stop();
            window.mediaRecorder.stream.getTracks().forEach(track => track.stop());
            sendResponse({ status: "Recording stopped successfully" });
        } else {
            sendResponse({ status: "No active recording found" });
        }
    }

    return true;
});