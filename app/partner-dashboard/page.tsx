'use client'

import { useState } from 'react'
import { 
  CurrencyEuroIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'

const stats = [
  { 
    name: 'Chiffre d\'affaires', 
    value: '12 500€', 
    change: '+12%',
    trend: 'up',
    period: 'vs mois dernier'
  },
  { 
    name: 'Nouveaux contacts', 
    value: '245', 
    change: '+18%',
    trend: 'up',
    period: 'vs mois dernier'
  },
  { 
    name: 'Messages non lus', 
    value: '12', 
    change: '-25%',
    trend: 'down',
    period: 'vs mois dernier'
  },
  { 
    name: 'Note moyenne', 
    value: '4.8/5', 
    change: '+0.2',
    trend: 'up',
    period: 'vs mois dernier'
  },
]

const recentActivity = [
  {
    id: 1,
    type: 'message',
    content: 'Nouveau message de Sophie M. concernant votre disponibilité',
    date: '2 min',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    id: 2,
    type: 'review',
    content: 'Nouvel avis 5 étoiles de Pierre D.',
    date: '1h',
    icon: StarIcon,
  },
  {
    id: 3,
    type: 'contact',
    content: 'Nouvelle demande de contact pour juillet 2024',
    date: '3h',
    icon: UserGroupIcon,
  },
]

export default function PartnerDashboard() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            L&apos;activité de votre compte
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.name}
                </p>
                <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <button className="text-gray-400 hover:text-gray-500">
                <EllipsisHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 flex items-center">
              {stat.trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ml-2 ${
                stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
              }`}>
                {stat.change}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                {stat.period}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Activité récente */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            Activité récente
          </h2>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivity.length - 1 ? (
                      <span
                        className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center ring-8 ring-white dark:ring-gray-800">
                          <activity.icon className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {activity.content}
                          </p>
                        </div>
                        <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                          <time dateTime={activity.date}>{activity.date}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}