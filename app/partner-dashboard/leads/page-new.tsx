'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Filter, CheckCircle, MessageSquare, Loader2, Calendar, Users, MapPin, Euro } from "lucide-react"
import { useToast } from '@/hooks/useToast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type QuoteRequest = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  createdAt: string
  status: 'PENDING' | 'CONTACTED' | 'QUOTED' | 'ACCEPTED' | 'DECLINED'
  budget?: string
  eventDate: string
  eventType: string
  guestCount: string
  venueLocation?: string
  message?: string | null
}

export default function Leads() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [leads, setLeads] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONTACTED' | 'QUOTED' | 'ACCEPTED' | 'DECLINED'>('all')

  // Charger les demandes de devis
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/quote-requests')
        
        if (response.ok) {
          const data = await response.json()
          setLeads(data)
        } else {
          toast({
            title: "Erreur",
            description: "Impossible de charger les demandes de devis",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erreur:', error)
        toast({
          title: "Erreur",
          description: "Erreur de connexion",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    if (session?.user?.id) {
      fetchLeads()
    }
  }, [session?.user?.id, toast])

  const totalLeads = leads.length
  const newLeads = leads.filter(l => l.status === 'PENDING').length
  const contactedLeads = leads.filter(l => l.status === 'CONTACTED').length
  const convertedLeads = leads.filter(l => l.status === 'ACCEPTED').length
  const conversionRate = totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}%` : '0%'

  const handleUpdateStatus = async (id: string, status: QuoteRequest['status']) => {
    try {
      const response = await fetch(`/api/quote-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        const updatedLead = await response.json()
        setLeads(leads.map(lead => 
          lead.id === id ? updatedLead : lead
        ))
        toast({
          title: "Succès",
          description: "Statut mis à jour"
        })
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast({
        title: "Erreur",
        description: "Erreur de connexion",
        variant: "destructive"
      })
    }
  }

  const filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filter)

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Demandes de devis
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos demandes de devis et suivez leur progression
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {totalLeads}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nouveaux</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {newLeads}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Acceptés</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {convertedLeads}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <CheckCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de conversion</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {conversionRate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {filter === 'all' ? 'Tous les leads' :
                   filter === 'PENDING' ? 'Nouveaux' :
                   filter === 'CONTACTED' ? 'Contactés' :
                   filter === 'QUOTED' ? 'Devis envoyés' :
                   filter === 'ACCEPTED' ? 'Acceptés' :
                   'Refusés'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Tous les leads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('PENDING')}>
                  Nouveaux
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('CONTACTED')}>
                  Contactés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('QUOTED')}>
                  Devis envoyés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('ACCEPTED')}>
                  Acceptés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('DECLINED')}>
                  Refusés
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des leads */}
      <div className="space-y-4">
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'all' 
                  ? 'Aucune demande de devis pour le moment' 
                  : `Aucune demande ${filter === 'PENDING' ? 'nouvelle' : filter === 'CONTACTED' ? 'contactée' : filter === 'QUOTED' ? 'avec devis envoyé' : filter === 'ACCEPTED' ? 'acceptée' : 'refusée'}`}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead) => (
            <Card key={lead.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {lead.firstName} {lead.lastName}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lead.status === 'PENDING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                        lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        lead.status === 'QUOTED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                        lead.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {lead.status === 'PENDING' ? 'Nouveau' :
                         lead.status === 'CONTACTED' ? 'Contacté' :
                         lead.status === 'QUOTED' ? 'Devis envoyé' :
                         lead.status === 'ACCEPTED' ? 'Accepté' :
                         'Refusé'}
                      </span>
                    </h3>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        📧 {lead.email}
                      </p>
                      {lead.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📱 {lead.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Reçu le {new Date(lead.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                
                {/* Détails de l'événement */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Date événement</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {new Date(lead.eventDate).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Invités</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {lead.guestCount}
                      </p>
                    </div>
                  </div>

                  {lead.budget && (
                    <div className="flex items-center gap-2">
                      <Euro className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.budget}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                        {lead.eventType}
                      </p>
                    </div>
                  </div>
                </div>

                {lead.venueLocation && (
                  <div className="mb-4 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Lieu</p>
                      <p className="text-sm text-gray-900 dark:text-white">{lead.venueLocation}</p>
                    </div>
                  </div>
                )}

                {lead.message && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Message du client</p>
                    <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                      {lead.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Changer le statut
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'PENDING')}>
                        Nouveau
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}>
                        Contacté
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'QUOTED')}>
                        Devis envoyé
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'ACCEPTED')}>
                        Accepté
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateStatus(lead.id, 'DECLINED')}>
                        Refusé
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `mailto:${lead.email}`}
                  >
                    Contacter par email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

