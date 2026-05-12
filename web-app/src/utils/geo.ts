import type { LatLng } from '../types/models'

const R = 6371

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = deg2rad(b.lat - a.lat)
  const dLng = deg2rad(b.lng - a.lng)
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(a.lat)) *
      Math.cos(deg2rad(b.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
  return R * c
}

function deg2rad(d: number): number {
  return (d * Math.PI) / 180
}

export function parseInterestInput(raw: string): string[] {
  return raw
    .split(/[,#]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
}
