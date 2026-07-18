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
  // IMPORTANT: Plasmo's shadow host element has the id `plasmo-shadow-container`
  // (not the tag name `plasmo-csui` — that selector was never actually matching
  // anything, so this override was silently doing nothing). Host pages with
  // broad CSS resets can also collapse the Root Container's positioning, so
  // per Plasmo's documented caveat we force it with !important.
  // https://docs.plasmo.com/framework/content-scripts-ui/styling#root-container-style
  //
  // The :host rule below is a separate, defensive fix: sites built heavily on
  // web components (Reddit's shreddit-* redesign is exactly this) often ship a
  // global CSS rule like `:not(:defined) { visibility: hidden }` to avoid a
  // flash of unstyled content for their own custom elements before they
  // upgrade. Our <plasmo-csui> host is technically an "undefined" custom
  // element too (it's never registered via customElements.define), so it can
  // get caught by that same page-wide rule and rendered invisible even though
  // it's correctly mounted with content inside. :host lets us style the host
  // element itself from inside the shadow root to force it back to visible.
  style.textContent = `
    :host {
      all: initial !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    #plasmo-shadow-container {
      position: fixed !important;
      inset: 0 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `
  return style
}
function getScrollPosition(target: EventTarget | null): number {
  if (target instanceof Element) return target.scrollTop
  return window.scrollY
}

// TEMP DEBUG — flip to false (or delete this block + the log calls below)
// once the panel is confirmed working end-to-end.
const DEBUG_DRIFT = true

function ScrollMonitorOverlay() {
  const [enabled, setEnabled] = useState(true)
  const [visible, setVisible] = useState(false)
  const [distractionStartedAt, setDistractionStartedAt] = useState(0)
  const [snoozedUntil, setSnoozedUntil] = useState<number | null>(null)

  // Respect the on/off toggle from the popup — read it on load, and keep
  // listening so a toggle flip is picked up immediately on an already-open tab.
  useEffect(() => {
    chrome.storage.local.get(['driftEnabled'], (result) => {
      const next = result.driftEnabled ?? true
      if (DEBUG_DRIFT) console.log('[DRIFT] driftEnabled from storage:', result.driftEnabled, '-> using', next)
      setEnabled(next)
    })

    function handleStorageChange(
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) {
      if (areaName === 'local' && 'driftEnabled' in changes) {
        if (DEBUG_DRIFT) console.log('[DRIFT] driftEnabled changed to:', changes.driftEnabled.newValue)
        setEnabled(changes.driftEnabled.newValue ?? true)
      }
    }

    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => chrome.storage.onChanged.removeListener(handleStorageChange)
  }, [])

  useEffect(() => {
    if (!enabled) {
      if (DEBUG_DRIFT) console.log('[DRIFT] disabled — not attaching scroll listener')
      setVisible(false)
      return
    }

    const isMatch = isDistractionSite(window.location.hostname)
    if (DEBUG_DRIFT) console.log('[DRIFT] content script active on', window.location.hostname, '— isDistractionSite:', isMatch)
    if (!isMatch) return

    let velocityState: VelocityState = initialVelocityState()
    let throttleTimer: ReturnType<typeof setTimeout> | null = null
    let sampleCount = 0

    function handleScroll(e: Event) {
      if (throttleTimer) return
      throttleTimer = setTimeout(() => (throttleTimer = null), 2000)

      if (snoozedUntil && Date.now() < snoozedUntil) {
        if (DEBUG_DRIFT) console.log('[DRIFT] snoozed until', new Date(snoozedUntil).toLocaleTimeString())
        return
      }

      const scrollY = getScrollPosition(e.target)
      const sample = { scrollY, timestampMs: Date.now() }
      const result = recordScrollSample(velocityState, sample)
      velocityState = result.state
      sampleCount++

      if (DEBUG_DRIFT) {
        console.log(
          '[DRIFT] sample', sampleCount,
          '| scrollY:', scrollY,
          '| sessionStartedAt:', velocityState.sessionStartedAt,
          '| shouldIntervene:', result.shouldIntervene
        )
      }

      if (result.shouldIntervene && !visible) {
        if (DEBUG_DRIFT) console.log('[DRIFT] 🚨 intervention triggered')
        setDistractionStartedAt(velocityState.sessionStartedAt ?? Date.now())
        setVisible(true)
      }
    }

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', handleScroll, { capture: true })
  }, [enabled, visible, snoozedUntil])

  if (!enabled || !visible) return null

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