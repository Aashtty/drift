// apps/extension/lib/distractionSites.ts
// Default set — overridable later via user_settings.distraction_sites (Phase 6 sync).
export const DEFAULT_DISTRACTION_SITES = [
  'twitter.com',
  'x.com',
  'reddit.com',
  'youtube.com',
  'instagram.com',
]

export function isDistractionSite(hostname: string, sites: string[] = DEFAULT_DISTRACTION_SITES): boolean {
  return sites.some((site) => hostname === site || hostname.endsWith(`.${site}`))
}