import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fitMapToPoints,
  loadGoogleMaps,
  type GoogleMap,
  type GoogleMarker,
  type LatLng,
} from '../utils/loadGoogleMaps'
import { buildMapsDirectionsUrl, buildMapsPlaceUrl } from '../utils/mapsUrls'

type Props = {
  lat: number
  lng: number
  label?: string
  className?: string
}

const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()

export function isGoogleMapsConfigured(): boolean {
  return Boolean(mapsKey)
}

function readUserPosition(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    )
  })
}

export function MeetupPlaceMap({ lat, lng, label, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<GoogleMap | null>(null)
  const googleRef = useRef<Awaited<ReturnType<typeof loadGoogleMaps>> | null>(null)
  const eventMarkerRef = useRef<GoogleMarker | null>(null)
  const userMarkerRef = useRef<GoogleMarker | null>(null)

  const [loadError, setLoadError] = useState<string | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [userPosition, setUserPosition] = useState<LatLng | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const updateMarkers = useCallback(
    (google: Awaited<ReturnType<typeof loadGoogleMaps>>, user: LatLng | null) => {
      const map = mapRef.current
      if (!map) {
        return
      }
      const event = { lat, lng }

      if (!eventMarkerRef.current) {
        eventMarkerRef.current = new google.maps.Marker({
          position: event,
          map,
          title: label ?? 'Event',
          label: 'E',
        })
      } else {
        eventMarkerRef.current.setPosition(event)
      }

      if (user) {
        if (!userMarkerRef.current) {
          userMarkerRef.current = new google.maps.Marker({
            position: user,
            map,
            title: 'Your location',
            label: 'Y',
          })
        } else {
          userMarkerRef.current.setPosition(user)
        }
      }

      const points = user ? [event, user] : [event]
      fitMapToPoints(map, google, points)
    },
    [lat, lng, label],
  )

  useEffect(() => {
    if (!mapsKey) {
      return
    }
    let cancelled = false
    setLocationError(null)

    void readUserPosition()
      .then((pos) => {
        if (!cancelled) {
          setUserPosition(pos)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationError(
            'Allow location access to see yourself on the map and open turn-by-turn directions.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mapsKey || !containerRef.current) {
      return
    }
    let cancelled = false
    setLoadError(null)

    void loadGoogleMaps(mapsKey)
      .then((google) => {
        if (cancelled || !containerRef.current) {
          return
        }
        googleRef.current = google
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: { lat, lng },
          zoom: 15,
          mapTypeControl: false,
          streetViewControl: true,
          fullscreenControl: true,
        })
        setMapReady(true)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : 'Could not load the map.',
          )
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!mapReady || !googleRef.current) {
      return
    }
    updateMarkers(googleRef.current, userPosition)
  }, [mapReady, lat, lng, label, userPosition, updateMarkers])

  async function openDirections() {
    setLocating(true)
    setLocationError(null)
    try {
      const origin = userPosition ?? (await readUserPosition())
      if (!userPosition) {
        setUserPosition(origin)
      }
      if (googleRef.current && mapRef.current) {
        updateMarkers(googleRef.current, origin)
      }
      const url = buildMapsDirectionsUrl(origin, { lat, lng })
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      setLocationError(
        'Location permission is required for directions. Enable it in your browser, then try again.',
      )
    } finally {
      setLocating(false)
    }
  }

  if (!mapsKey) {
    return (
      <p
        className={`rounded-2xl border border-dashed border-surface-600 bg-surface-900/40 px-4 py-6 text-center text-sm text-muted ${className}`}
      >
        Add <code className="text-brand">VITE_GOOGLE_MAPS_API_KEY</code> to show an
        interactive map (enable Maps JavaScript API in Google Cloud).
      </p>
    )
  }

  if (loadError) {
    return (
      <p
        className={`rounded-2xl border border-red-900/50 bg-red-950/30 px-4 py-6 text-center text-sm text-red-300 ${className}`}
      >
        {loadError}
      </p>
    )
  }

  const placeUrl = buildMapsPlaceUrl({ lat, lng })

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={containerRef}
        role="img"
        aria-label={label ? `Map showing ${label}` : 'Map showing event location'}
        className="h-56 w-full overflow-hidden rounded-2xl border border-surface-700 bg-surface-900 sm:h-64"
      />
      {userPosition ? (
        <p className="text-xs text-muted">
          Map pins: <span className="text-slate-300">E</span> = event,{' '}
          <span className="text-slate-300">Y</span> = you
        </p>
      ) : null}
      {locationError ? (
        <p className="text-xs text-amber-300/90">{locationError}</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={locating}
          onClick={() => void openDirections()}
          className="inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-surface-950 disabled:opacity-50"
        >
          {locating ? 'Getting location…' : 'Directions in Google Maps'}
        </button>
        <a
          href={placeUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl bg-surface-800 px-4 py-2 text-sm font-medium text-brand hover:bg-surface-700"
        >
          Open event in Maps
        </a>
      </div>
    </div>
  )
}
