// diagnose.mjs — run with: node diagnose.mjs
import dns from 'node:dns'
import { promisify } from 'node:util'

const lookup = promisify(dns.lookup)

console.log('--- Node version ---')
console.log(process.version)

console.log('\n--- DNS resolution (both families) ---')
try {
  const v4 = await lookup('registry.npmjs.org', { family: 4 })
  console.log('IPv4:', v4)
} catch (e) {
  console.log('IPv4 lookup FAILED:', e.message)
}
try {
  const v6 = await lookup('registry.npmjs.org', { family: 6 })
  console.log('IPv6:', v6)
} catch (e) {
  console.log('IPv6 lookup FAILED:', e.message)
}
try {
  const auto = await lookup('registry.npmjs.org')
  console.log('Default (auto):', auto)
} catch (e) {
  console.log('Default lookup FAILED:', e.message)
}

console.log('\n--- Proxy env vars ---')
for (const key of ['HTTP_PROXY', 'HTTPS_PROXY', 'http_proxy', 'https_proxy', 'NO_PROXY', 'no_proxy']) {
  console.log(key, '=', process.env[key] ?? '(not set)')
}

console.log('\n--- Raw fetch to registry root (10s timeout) ---')
try {
  const start = Date.now()
  const res = await fetch('https://registry.npmjs.org/', { signal: AbortSignal.timeout(10000) })
  console.log('SUCCESS in', Date.now() - start, 'ms, status:', res.status)
} catch (e) {
  console.log('FAILED:', e.name, '-', e.message)
  console.log('cause:', e.cause)
}

console.log('\n--- Raw fetch to registry/plasmo specifically (10s timeout) ---')
try {
  const start = Date.now()
  const res = await fetch('https://registry.npmjs.org/plasmo', { signal: AbortSignal.timeout(10000) })
  console.log('SUCCESS in', Date.now() - start, 'ms, status:', res.status)
} catch (e) {
  console.log('FAILED:', e.name, '-', e.message)
  console.log('cause:', e.cause)
}

console.log('\n--- Same fetch, forcing HTTP/1.1 keepalive false ---')
try {
  const start = Date.now()
  const res = await fetch('https://registry.npmjs.org/plasmo', {
    signal: AbortSignal.timeout(10000),
    keepalive: false,
  })
  console.log('SUCCESS in', Date.now() - start, 'ms, status:', res.status)
} catch (e) {
  console.log('FAILED:', e.name, '-', e.message)
  console.log('cause:', e.cause)
}