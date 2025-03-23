"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { StorefrontForm } from "../components/StorefrontForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export default function PartnerStorefrontPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [storefront, setStorefront] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStorefrontData = async () => {
      try {
        const response = await fetch("/api/partner-storefront")
        if (response.ok) {
          const data = await response.json()
          if (data) {
            console.log('[Page] Données reçues:', data)
            setStorefront(data)
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les données de la vitrine.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user?.role === "PARTNER") {
      fetchStorefrontData()
    }
  }, [session, toast])

  if (isLoading) {
    return <div>Chargement...</div>
  }

  if (!storefront) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Créer une vitrine</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Vous n&apos;avez pas encore de vitrine. Veuillez en créer une.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gérer votre vitrine</CardTitle>
      </CardHeader>
      <CardContent>
        <StorefrontForm storefront={storefront} />
      </CardContent>
    </Card>
  )
}