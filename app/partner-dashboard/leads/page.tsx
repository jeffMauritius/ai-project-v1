'use client'

import { useState } from 'react'
import { 
  EyeIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  CalendarDaysIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'

type Lead = {
  id: number
  type: 'view' | 'contact' | 'quote'
  clientName: string
  clientEmail: string
  clientPhone?: string
  date: string
  status: 'new' | 'contacted' | 'converted' | 'lost'
  message?: string
  source: string
  eventDate?: string
}

const mockLeads: Lead[] = [
  {
    id: 1,
    type: 'view',
    clientName: 'Visiteur anonyme',
    clientEmail: 'notification@monmariage.ai',
    date: '2024-01-15T14:30:00',
    status: 'new',
    source: 'Recherche',
    message: 'A consulté votre vitrine pendant 5 minutes'
  },
  {
    id: 2,
    type: 'contact',
    clientName: 'Sophie Martin',
    clientEmail: 'sophie.martin@email.com',
    clientPhone: '06 12 34 56 78',
    date: '2024-01-15T10:30:00',
    status: 'contacted',
    message: 'Je vous propose un rendez-vous le 20 janvier à 14h...',
    source: 'Vitrine',
    eventDate: '2024-07-15'
  },
  {
    id: 3,
    type: 'quote',
    clientName: 'Pierre Dubois',
    clientEmail: 'pierre.dubois@email.com',
    clientPhone: '06 98 76 54 32',
    date: '2024-01-14T16:45:00',
    status: 'converted',
    message: 'L&apos;équipe a été très professionnelle et à l&apos;écoute de nos besoins. Je recommande vivement.',
    source: 'Recherche directe',
    eventDate: '2024-09-20'
  }
]

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'converted' | 'lost'>('all')

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    converted: leads.filter(l => l.status === 'converted').length,
    conversionRate: `${Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)}%`
  }

  const getLeadTypeIcon = (type: Lead['type']) => {
    switch (type) {
      case 'view':
        return <EyeIcon className="h-5 w-5 text-blue-500" />
      case 'contact':
        return <EnvelopeIcon className="h-5 w-5 text-green-500" />
      case 'quote':
        return <ChartBarIcon className="h-5 w-5 text-purple-500" />
    }
  }

  const getLeadStatusBadge = (status: Lead['status']) => {
    const styles = {
      new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      converted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const filteredLeads = filter === 'all' ? leads : leads.filter(lead => lead.status === filter)

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Leads</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Suivez et gérez vos prospects
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total des leads
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.total}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500 ml-2">+12%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nouveaux leads
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.new}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500 ml-2">+5%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Leads contactés
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.contacted}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500 ml-2">+8%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Leads convertis
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.converted}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-500 ml-2">-2%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs mois dernier
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Taux de conversion
              </p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                {stats.conversionRate}
              </p>
            </div>
            <button className="text-gray-400 hover:text-gray-500">
              <EllipsisHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center">
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm text-green-500 ml-2">+3%</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
              vs mois dernier
            </span>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === 'all'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === 'new'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Nouveaux
                </button>
                <button
                  onClick={() => setFilter('contacted')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === 'contacted'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Contactés
                </button>
                <button
                  onClick={() => setFilter('converted')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === 'converted'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Convertis
                </button>
                <button
                  onClick={() => setFilter('lost')}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    filter === 'lost'
                      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-100'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  Perdus
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des leads */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getLeadTypeIcon(lead.type)}
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {lead.type === 'view' ? 'Visite' : lead.type === 'contact' ? 'Contact' : 'Devis'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {lead.clientName}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {lead.clientEmail}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{lead.source}</div>
                  {lead.eventDate && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <CalendarDaysIcon className="inline-block h-4 w-4 mr-1" />
                      {new Date(lead.eventDate).toLocaleDateString()}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(lead.date).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getLeadStatusBadge(lead.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de détail */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Détails du lead
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {new Date(selectedLead.date).toLocaleString()}
                </p>
              </div>
              {getLeadStatusBadge(selectedLead.status)}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Client
                </label>
                <div className="mt-1">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLead.clientName}</p>
                  <div className="mt-1 flex items-center space-x-4">
                    <a 
                      href={`mailto:${selectedLead.clientEmail}`}
                      className="flex items-center text-sm text-pink-600 hover:text-pink-500"
                    >
                      <EnvelopeIcon className="h-4 w-4 mr-1" />
                      {selectedLead.clientEmail}
                    </a>
                    {selectedLead.clientPhone && (
                      <a 
                        href={`tel:${selectedLead.clientPhone}`}
                        className="flex items-center text-sm text-pink-600 hover:text-pink-500"
                      >
                        <PhoneIcon className="h-4 w-4 mr-1" />
                        {selectedLead.clientPhone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {selectedLead.message && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedLead.message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Source
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {selectedLead.source}
                  </p>
                </div>
                {selectedLead.eventDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date de l&apos;événement
                    </label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                      {new Date(selectedLead.eventDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                >
                  Fermer
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-500 rounded-md"
                >
                  Marquer comme contacté
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}