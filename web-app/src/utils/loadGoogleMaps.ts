export type LatLng = { lat: number; lng: number }

export type GoogleMap = {
  setCenter: (center: LatLng) => void
  fitBounds: (
    bounds: GoogleLatLngBounds,
    padding?: number | { top: number; right: number; bottom: number; left: number },
  ) => void
}

export type GoogleMarker = {
  setPosition: (position: LatLng) => void
}

export type GoogleMapsNamespace = {
  maps: {
    Map: new (
      el: HTMLElement,
      opts: {
        center: LatLng
        zoom: number
        mapTypeControl?: boolean
        streetViewControl?: boolean
        fullscreenControl?: boolean
      },
    ) => GoogleMap
    Marker: new (opts: {
      position: LatLng
      map: GoogleMap
      title?: string
      label?: string
    }) => GoogleMarker
    LatLngBounds: new () => {
      extend: (point: LatLng) => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleMapsNamespace
  }
}

let loadPromise: Promise<GoogleMapsNamespace> | null = null

export function loadGoogleMaps(apiKey: string): Promise<GoogleMapsNamespace> {
  if (window.google?.maps) {
    return Promise.resolve(window.google)
  }
  if (loadPromise) {
    return loadPromise
  }
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google)
      } else {
        reject(new Error('Google Maps failed to initialize.'))
      }
    }
    script.onerror = () => reject(new Error('Failed to load Google Maps.'))
    document.head.appendChild(script)
  })
  return loadPromise
}

export type GoogleLatLngBounds = InstanceType<
  GoogleMapsNamespace['maps']['LatLngBounds']
>

export function fitMapToPoints(
  map: GoogleMap,
  google: GoogleMapsNamespace,
  points: LatLng[],
): void {
  if (points.length === 0) {
    return
  }
  if (points.length === 1) {
    map.setCenter(points[0])
    return
  }
  const bounds = new google.maps.LatLngBounds()
  for (const p of points) {
    bounds.extend(p)
  }
  map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 })
}
