// apps/extension/background.ts
export {}

const DRIFT_APP_URL = 'http://localhost:3000'

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ driftEnabled: true })
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ type: 'PONG', appUrl: DRIFT_APP_URL })
    return true
  }

  if (message.type === 'OPEN_DRIFT') {
    // Local-only: this just opens a tab to the already-running DRIFT app.
    // No network request, no data sent anywhere — matches §4.7 exactly.
    chrome.tabs.create({ url: DRIFT_APP_URL })
    sendResponse({ type: 'OPENED' })
    return true
  }

  return false
})