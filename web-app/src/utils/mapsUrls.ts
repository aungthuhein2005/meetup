export type LatLng = { lat: number; lng: number }

export function formatLatLng({ lat, lng }: LatLng): string {
  return `${lat},${lng}`
}

export function buildMapsPlaceUrl(point: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatLatLng(point))}`
}

export function buildMapsDirectionsUrl(
  origin: LatLng,
  destination: LatLng,
  travelMode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving',
): string {
  const params = new URLSearchParams({
    api: '1',
    origin: formatLatLng(origin),
    destination: formatLatLng(destination),
    travelmode: travelMode,
  })
  return `https://www.google.com/maps/dir/?${params.toString()}`
}
