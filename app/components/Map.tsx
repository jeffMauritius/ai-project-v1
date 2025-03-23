"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Configuration des icônes Leaflet
const icon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  shadowAnchor: [12, 41],
  shadowPopupAnchor: [1, -34],
})

interface MapProps {
  latitude: number
  longitude: number
  interventionType: string
  interventionRadius: number
  onLocationChange?: (lat: number, lng: number) => void
}

export default function Map({ latitude, longitude, interventionType, interventionRadius, onLocationChange }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialiser la carte
    mapInstance.current = L.map(mapRef.current).setView([latitude, longitude], 12)
    
    // Ajouter le fond de carte OpenStreetMap
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstance.current)

    // Ajouter le marqueur avec l'icône personnalisée
    markerRef.current = L.marker([latitude, longitude], { icon }).addTo(mapInstance.current)

    // Ajouter le cercle si le type d'intervention est "radius"
    if (interventionType === "radius") {
      circleRef.current = L.circle(
        [latitude, longitude],
        {
          radius: interventionRadius * 1000,
          color: "#3b82f6",
          fillColor: "#3b82f6",
          fillOpacity: 0.2,
          weight: 2,
        }
      ).addTo(mapInstance.current)
    }

    // Gérer le clic sur la carte
    if (onLocationChange) {
      mapInstance.current.on("click", (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng
        markerRef.current?.setLatLng([lat, lng])
        if (circleRef.current) {
          circleRef.current.setLatLng([lat, lng])
        }
        onLocationChange(lat, lng)
      })
    }

    // Nettoyer la carte lors du démontage du composant
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
      }
    }
  }, [latitude, longitude, interventionType, interventionRadius, onLocationChange])

  return <div ref={mapRef} className="w-full h-[300px] rounded-md" />
} 