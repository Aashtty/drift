// apps/extension/contents/scrollMonitor.ts
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'
import { useEffect, useState } from 'react'
import { recordScrollSample, initialVelocityState, type VelocityState } from '~lib/scrollVelocity'
import { isDistractionSite } from '~lib/distractionSites'
import { InterventionPanel } from '~components/InterventionPanel'

export const config: PlasmoCSConfig = {
  matches: ['https://*.twitter.com/*', 'https://*.x.com/*', 'https://*.reddit.com/*', 'https://*.youtube.com/*', 'https://*.instagram.com/*'],
  run_at: 'document_idle',
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style')
  style.textContent = `plasmo-csui { z-index: 2147483647; }`
  return style
}

function ScrollMonitorOverlay() {
  const [visible, setVisible] = useState(false)
  const [distractionStartedAt, setDistractionStartedAt] = useState(0)
  // In-memory only, per page load — intentionally NOT persisted to
  // chrome.storage or sent anywhere. Snooze resets on navigation/reload,
  // which is correct: a fresh page context is a fresh judgment call.
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null)

  useEffect(() => {
    if (!isDistractionSite(window.location.hostname)) return

    let velocityState: VelocityState = initialVelocityState()
    let throttleTimer: ReturnType<typeof setTimeout> | null = null

    function handleScroll() {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => (throttleTimer = null), 2000)

      if (snoozedUntil && Date.now() < snoozedUntil) return

      const sample = { scrollY: window.scrollY, timestampMs: Date.now() }
      const result = recordScrollSample(velocityState, sample)
      velocityState = result.state

      if (result.shouldIntervene && !visible) {
        setDistractionStartedAt(velocityState.slowScrollStartedAt ?? Date.now())
        setVisible(true)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visible, snoozedUntil])

  if (!visible) return null

  return (
    <InterventionPanel
      distractionStartedAt={distractionStartedAt}
      currentTaskName={null}
      onDismiss={() => setVisible(false)}
      onBackToDrift={() => {
        // Fire-and-forget message to the background worker — the ONLY
        // "network-adjacent" action in this whole flow, and it's just
        // opening a local tab, not sending scroll data anywhere.
        chrome.runtime.sendMessage({ type: 'OPEN_DRIFT' })
        setVisible(false)
      }}
      onFiveMoreMinutes={() => {
        setSnoozedUntil(Date.now() + 5 * 60 * 1000)
        setVisible(false)
      }}
    />
  )
}

export default ScrollMonitorOverlay