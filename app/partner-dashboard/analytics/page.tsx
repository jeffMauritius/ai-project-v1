'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingUpIcon as ArrowTrendingUpIcon, TrendingDownIcon as ArrowTrendingDownIcon, EyeIcon, HeartIcon, MessageSquareIcon, StarIcon } from "lucide-react"

const metrics = [
  {
    name: "Vues du profil",
    value: "1,234",
    change: "+12%",
    trend: "up",
    period: "vs mois dernier",
    icon: EyeIcon
  },
  {
    name: "Favoris",
    value: "256",
    change: "+18%",
    trend: "up",
    period: "vs mois dernier",
    icon: HeartIcon
  },
  {
    name: "Messages reçus",
    value: "45",
    change: "-5%",
    trend: "down",
    period: "vs mois dernier",
    icon: MessageSquareIcon
  },
  {
    name: "Note moyenne",
    value: "4.8/5",
    change: "+0.2",
    trend: "up",
    period: "vs mois dernier",
    icon: StarIcon
  }
]

const recentActivity = [
  {
    id: 1,
    type: "view",
    content: "Votre profil a été consulté par Sophie M.",
    date: "Il y a 2 minutes"
  },
  {
    id: 2,
    type: "favorite",
    content: "Pierre D. a ajouté votre établissement en favori",
    date: "Il y a 1 heure"
  },
  {
    id: 3,
    type: "message",
    content: "Nouveau message de Marie L. concernant une disponibilité",
    date: "Il y a 3 heures"
  },
  {
    id: 4,
    type: "review",
    content: "Nouvelle note 5 étoiles de Jean R.",
    date: "Il y a 5 heures"
  }
]

export default function Analytics() {
  const [period, setPeriod] = useState("7d")

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Aperçu de votre activité
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sélectionner une période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="12m">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric) => (
          <Card key={metric.name}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {metric.name}
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                </div>
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <metric.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {metric.trend === 'up' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ml-2 ${
                  metric.trend === 'up' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {metric.period}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Vues du profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Graphique en construction
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages reçus</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
              Graphique en construction
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'view' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  activity.type === 'favorite' ? 'bg-pink-100 dark:bg-pink-900/20' :
                  activity.type === 'message' ? 'bg-green-100 dark:bg-green-900/20' :
                  'bg-yellow-100 dark:bg-yellow-900/20'
                }`}>
                  {activity.type === 'view' ? <EyeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" /> :
                   activity.type === 'favorite' ? <HeartIcon className="h-5 w-5 text-pink-600 dark:text-pink-400" /> :
                   activity.type === 'message' ? <MessageSquareIcon className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                   <StarIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.content}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.date}
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  Voir
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}