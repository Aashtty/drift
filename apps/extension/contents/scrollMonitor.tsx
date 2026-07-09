// apps/extension/contents/scrollMonitor.tsx
import type { PlasmoCSConfig, PlasmoGetStyle } from 'plasmo'
import { useEffect, useState } from 'react'
import { recordScrollSample, initialVelocityState, type VelocityState } from '~lib/scrollVelocity'
import { isDistractionSite } from '~lib/distractionSites'
import { InterventionPanel } from '~components/InterventionPanel'

export const config: PlasmoCSConfig = {
  matches: [
    'https://*.twitter.com/*', 'https://twitter.com/*',
    'https://*.x.com/*', 'https://x.com/*',
    'https://*.reddit.com/*', 'https://reddit.com/*',
    'https://*.youtube.com/*', 'https://youtube.com/*',
    'https://*.instagram.com/*', 'https://instagram.com/*',
  ],
  run_at: 'document_idle',
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement('style')
  style.textContent = `plasmo-csui { z-index: 2147483647; }`
  return style
}

function getScrollPosition(target: EventTarget | null): number {
  if (target instanceof Element) return target.scrollTop
  return window.scrollY
}

// TEMP DEBUG — confirms the content script actually loaded and matched
// this page at all. Remove once the panel is confirmed working.
console.log('[DRIFT] scrollMonitor content script loaded on', window.location.hostname)

function ScrollMonitorOverlay() {
  const [visible, setVisible] = useState(false)
  const [distractionStartedAt, setDistractionStartedAt] = useState(0)
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null)

  useEffect(() => {
    const isMatch = isDistractionSite(window.location.hostname)
    console.log('[DRIFT] isDistractionSite check:', window.location.hostname, '->', isMatch)
    if (!isMatch) return

    let velocityState: VelocityState = initialVelocityState()
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    let scrollEventCount = 0

    function handleScroll(e: Event) {
      scrollEventCount++
      if (scrollEventCount <= 5) {
        console.log('[DRIFT] scroll event #', scrollEventCount, 'target:', e.target)
      }
      if (throttleTimer) return
      throttleTimer = setTimeout(() => (throttleTimer = null), 2000)

      if (snoozedUntil && Date.now() < snoozedUntil) return

      const scrollY = getScrollPosition(e.target)
      const sample = { scrollY, timestampMs: Date.now() }
      const result = recordScrollSample(velocityState, sample)
      velocityState = result.state

      if (result.shouldIntervene && !visible) {
        console.log('[DRIFT] intervention triggered!')
        setDistractionStartedAt(velocityState.slowScrollStartedAt ?? Date.now())
        setVisible(true)
      }
    }

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', handleScroll, { capture: true })
  }, [visible, snoozedUntil])

  if (!visible) return null

  return (
    <InterventionPanel
      distractionStartedAt={distractionStartedAt}
      currentTaskName={null}
      onDismiss={() => setVisible(false)}
      onBackToDrift={() => {
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