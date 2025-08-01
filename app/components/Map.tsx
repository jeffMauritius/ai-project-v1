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
})

interface MapProps {
  latitude: number
  longitude: number
  interventionType: string
  interventionRadius: number
  onLocationChange?: (lat: number, lng: number) => void
  enableGeolocation?: boolean
}

export default function Map({ 
  latitude, 
  longitude, 
  interventionType, 
  interventionRadius, 
  onLocationChange,
  enableGeolocation = false 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const geolocationRef = useRef<L.Control | null>(null)

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

    // Ajouter le contrôle de géolocalisation si activé
    if (enableGeolocation) {
      // Créer un contrôle personnalisé pour la géolocalisation
      const GeolocationControl = L.Control.extend({
        onAdd: function() {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control')
          const button = L.DomUtil.create('a', 'leaflet-control-zoom-in', container)
          button.innerHTML = '📍'
          button.title = 'Me localiser'
          button.style.width = '30px'
          button.style.height = '30px'
          button.style.lineHeight = '30px'
          button.style.textAlign = 'center'
          button.style.fontSize = '16px'
          
          button.onclick = function() {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                function(position) {
                  const lat = position.coords.latitude
                  const lng = position.coords.longitude
                  
                  // Mettre à jour le marqueur et le cercle
                  markerRef.current?.setLatLng([lat, lng])
                  if (circleRef.current) {
                    circleRef.current.setLatLng([lat, lng])
                  }
                  
                  // Appeler le callback pour informer le parent
                  if (onLocationChange) {
                    onLocationChange(lat, lng)
                  }
                  
                  // Centrer la carte sur la position
                  mapInstance.current?.setView([lat, lng], 15)
                },
                function(error) {
                  console.error('Erreur de géolocalisation:', error.message)
                  alert('Impossible de récupérer votre position. Vérifiez que vous avez autorisé la géolocalisation.')
                },
                {
                  enableHighAccuracy: true,
                  timeout: 10000,
                  maximumAge: 60000
                }
              )
            } else {
              alert('La géolocalisation n\'est pas supportée par votre navigateur.')
            }
          }
          
          return container
        }
      })
      
      geolocationRef.current = new GeolocationControl({ position: 'topleft' }).addTo(mapInstance.current)
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
  }, [latitude, longitude, interventionType, interventionRadius, onLocationChange, enableGeolocation])

  return <div ref={mapRef} className="w-full h-[300px] rounded-md" />
} 