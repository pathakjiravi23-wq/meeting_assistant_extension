const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const statusText = document.getElementById('status-text');

// 1. Check current status from background as soon as popup opens
chrome.runtime.sendMessage({ action: "GET_STATUS" }, (response) => {
    if (response && response.isRecording) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusText.textContent = "Status: Running...";
    } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusText.textContent = "Status: Stopped";
    }
});

// 2. Start Meeting click
startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    stopBtn.disabled = false;
    statusText.textContent = "Status: Running...";

    chrome.runtime.sendMessage({ action: "START_MEETING" }, (response) => {
        console.log("Background response:", response);
        if (response && response.status === "Error") {
            // Revert UI if error occurs
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusText.textContent = "Status: Stopped";
        }
    });
});

// 3. Stop Meeting click
stopBtn.addEventListener('click', async () => {
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusText.textContent = "Status: Stopped";

    chrome.runtime.sendMessage({ action: "STOP_MEETING" }, (response) => {
        console.log("Background response:", response);
    });
});