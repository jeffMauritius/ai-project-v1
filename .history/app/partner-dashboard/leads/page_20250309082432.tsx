'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, Filter, CheckCircle, XCircle, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"

type Lead = {
  id: number
  clientName: string
  clientEmail: string
  clientPhone?: string
  date: string
  status: 'new' | 'contacted' | 'converted' | 'lost'
  source: string
  budget?: string
  eventDate?: string
  notes?: string
  lastContact?: string
}

const mockLeads: Lead[] = [
  {
    id: 1,
    clientName: "Sophie Martin",
    clientEmail: "sophie.martin@email.com",
    clientPhone: "06 12 34 56 78",
    date: "2024-01-15",
    status: "new",
    source: "Recherche directe",
    budget: "15000€ - 20000€",
    eventDate: "2024-07-15",
    notes: "Intéressée par notre formule Prestige"
  },
  {
    id: 2,
    clientName: "Pierre Dubois",
    clientEmail: "pierre.dubois@email.com",
    clientPhone: "06 98 76 54 32",
    date: "2024-01-14",
    status: "contacted",
    source: "Recommandation",
    budget: "25000€ - 30000€",
    eventDate: "2024-09-20",
    lastContact: "2024-01-14",
    notes: "Rendez-vous prévu le 20 janvier"
  },
  {
    id: 3,
    clientName: "Marie Leroy",
    clientEmail: "marie.leroy@email.com",
    date: "2024-01-10",
    status: "converted",
    source: "Instagram",
    budget: "18000€ - 22000€",
    eventDate: "2024-06-30",
    lastContact: "2024-01-12",
    notes: "Contrat signé"
  }
]

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'lost'>('all')
  const [notes, setNotes] = useState('')

  const totalLeads = leads.length
  const newLeads = leads.filter(l => l.status === 'new').length
  const contactedLeads = leads.filter(l => l.status === 'contacted').length
  const convertedLeads = leads.filter(l => l.status === 'converted').length
  const conversionRate = `${Math.round((convertedLeads / totalLeads) * 100)}%`

  const handleUpdateStatus = (id: number, status: Lead['status']) => {
    setLeads(leads.map(lead => 
      lead.id === id ? { ...lead, status, lastContact: status === 'contacted' ? new Date().toISOString().split('T')[0] : lead.lastContact } : lead
    ))
  }

  const handleAddNotes = () => {
    if (!selectedLead || !notes.trim()) return
    setLeads(leads.map(lead => 
      lead.id === selectedLead.id ? { 
        ...lead, 
        notes: lead.notes ? `${lead.notes}\n${notes}` : notes,
        lastContact: new Date().toISOString().split('T')[0]
      } : lead
    ))
    setSelectedLead(null)
    setNotes('')
  }

  const filteredLeads = filter === 'all' 
    ? leads 
    : leads.filter(lead => lead.status === filter)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Leads
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gérez vos prospects et suivez leur progression
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total des leads</p>
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
                <Star className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nouveaux leads</p>
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leads convertis</p>
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
                <XCircle className="h-5 w-5 text-orange-500" />
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
                   filter === 'new' ? 'Nouveaux' :
                   filter === 'contacted' ? 'Contactés' :
                   filter === 'converted' ? 'Convertis' :
                   'Perdus'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilter('all')}>
                  Tous les leads
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('new')}>
                  Nouveaux
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('contacted')}>
                  Contactés
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('converted')}>
                  Convertis
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilter('lost')}>
                  Perdus
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Liste des leads */}
      <div className="space-y-6">
        {filteredLeads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {lead.clientName}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lead.status === 'new' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      lead.status === 'converted' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {lead.status === 'new' ? 'Nouveau' :
                       lead.status === 'contacted' ? 'Contacté' :
                       lead.status === 'converted' ? 'Converti' :
                       'Perdu'}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lead.clientEmail}
                    </p>
                    {lead.clientPhone && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {lead.clientPhone}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(lead.date).toLocaleDateString()}
                  </p>
                  {lead.lastContact && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Dernier contact : {new Date(lead.lastContact).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Source</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{lead.source}</p>
                </div>
                {lead.budget && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Budget</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{lead.budget}</p>
                  </div>
                )}
                {lead.eventDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{`Date de l'événement`}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(lead.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {lead.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                    {lead.notes}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {lead.status !== 'converted' && lead.status !== 'lost' && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(lead.id, 'lost')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Perdu
                    </Button>
                    {lead.status === 'new' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(lead.id, 'contacted')}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Marquer comme contacté
                      </Button>
                    )}
                    {lead.status === 'contacted' && (
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(lead.id, 'converted')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Converti
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="default"
                  onClick={() => setSelectedLead(lead)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ajouter une note
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal d'ajout de note */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note</DialogTitle>
            <DialogDescription>
              Ajoutez {`une note pour suivre l'évolution de ce lead.`}
            </DialogDescription>
          </DialogHeader>
          {selectedLead && (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Client
                  </p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedLead.clientName}
                  </p>
                </div>
                {selectedLead.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes précédentes
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      {selectedLead.notes}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nouvelle note
                  </p>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ajoutez votre note ici..."
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedLead(null)
                    setNotes('')
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAddNotes}
                  disabled={!notes.trim()}
                >
                  Ajouter la note
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}