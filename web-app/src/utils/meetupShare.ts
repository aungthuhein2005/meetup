/** Public base URL for share links (set VITE_APP_URL when demoing on LAN, e.g. http://192.168.1.10:5173). */
export function getMeetupShareUrl(meetupId: string): string {
  const configured = import.meta.env.VITE_APP_URL?.trim()
  const base =
    configured ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  // Use the public landing page so scans don't force login.
  return `${base.replace(/\/$/, '')}/m/${encodeURIComponent(meetupId)}`
}
