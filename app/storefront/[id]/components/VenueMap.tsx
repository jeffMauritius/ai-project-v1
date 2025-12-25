'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Configuration de l'icône du marqueur
const venueIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
})

interface VenueMapProps {
  latitude: number
  longitude: number
  venueName: string
  className?: string
}

export default function VenueMap({ latitude, longitude, venueName, className = '' }: VenueMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    // Initialiser la carte
    mapInstance.current = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
      attributionControl: false,
    }).setView([latitude, longitude], 14)

    // Ajouter le fond de carte OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '',
    }).addTo(mapInstance.current)

    // Ajouter le marqueur avec popup
    L.marker([latitude, longitude], { icon: venueIcon })
      .addTo(mapInstance.current)
      .bindPopup(`<strong>${venueName}</strong>`)

    // Nettoyer lors du démontage
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [latitude, longitude, venueName])

  return (
    <div
      ref={mapRef}
      className={`w-full h-[200px] rounded-lg overflow-hidden ${className}`}
    />
  )
}
