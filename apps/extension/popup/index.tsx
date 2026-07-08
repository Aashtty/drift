// apps/extension/popup/index.tsx
import { useState, useEffect } from 'react'

function IndexPopup() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    chrome.storage.local.get(['driftEnabled'], (result) => {
      setEnabled(result.driftEnabled ?? true)
    })
  }, [])

  function toggle() {
    const next = !enabled
    setEnabled(next)
    chrome.storage.local.set({ driftEnabled: next })
  }

  return (
    <div style={{ width: 240, padding: 16, fontFamily: 'system-ui', background: '#0a0a1a', color: '#c8c8e8' }}>
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>DRIFT</p>
      <p style={{ fontSize: 12, opacity: 0.6, margin: '4px 0 16px' }}>Doom scroll detector</p>
      <button
        type="button"
        onClick={toggle}
        style={{
          width: '100%',
          padding: '8px 0',
          background: enabled ? 'rgba(102,85,204,0.2)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8,
          color: enabled ? '#6655CC' : '#c8c8e8',
          cursor: 'pointer',
        }}
      >
        {enabled ? 'Enabled' : 'Disabled'}
      </button>
    </div>
  )
}

export default IndexPopup