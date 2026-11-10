import { defineManifest } from "@crxjs/vite-plugin"

export default defineManifest({
    manifest_version: 3,
    name: "SyncBrief",
    version: "0.0.1",
    description: "AI meeting assistant with live transcription",
    action: { default_popup: "src/popup/index.html" },
    side_panel: { default_path: "src/sidepanel/index.html" },
    background: { service_worker: "src/background/index.ts", type: "module" },
    permissions: ["storage", "sidePanel", "tabs", "tabCapture", "offscreen", "activeTab"],
    host_permissions: ["http://127.0.0.1:8000/*", "ws://127.0.0.1:8000/*"],
})