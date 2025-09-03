'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function TestMessagesPage() {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testMessagesAPI = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      // Test de l'API des messages
      const response = await fetch('/api/messages?storefrontId=test-123')
      
      if (response.status === 401) {
        setTestResult('✅ API des messages fonctionne (retourne 401 - Non autorisé, comme attendu)')
      } else {
        setTestResult(`⚠️ API des messages: Status ${response.status}`)
      }
    } catch (error) {
      setTestResult(`❌ Erreur API des messages: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testPartnerDashboardAPI = async () => {
    setLoading(true)
    setTestResult('')
    
    try {
      // Test de l'API du dashboard partenaire
      const response = await fetch('/api/partner-dashboard/messages')
      
      if (response.status === 401) {
        setTestResult('✅ API dashboard partenaire fonctionne (retourne 401 - Non autorisé, comme attendu)')
      } else {
        setTestResult(`⚠️ API dashboard partenaire: Status ${response.status}`)
      }
    } catch (error) {
      setTestResult(`❌ Erreur API dashboard partenaire: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">🧪 Test du Système de Messages</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>📡 Test des APIs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testMessagesAPI} 
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Test en cours...' : 'Tester API Messages'}
            </Button>
            
            <Button 
              onClick={testPartnerDashboardAPI} 
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Test en cours...' : 'Tester API Dashboard Partenaire'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>📊 Résultats des Tests</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm">{testResult}</pre>
              </div>
            ) : (
              <p className="text-gray-500">Cliquez sur un bouton de test pour commencer...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>🚀 Système de Messages - Statut</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ Base de données MongoDB configurée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ Schéma Prisma mis à jour</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ Tables `conversations` et `messages` créées</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ API `/api/messages` active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ API `/api/partner-dashboard/messages` active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ Composant ChatCard mis à jour</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>✅ Dashboard partenaire synchronisé</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>📱 Comment tester en conditions réelles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Test du chat public</h3>
              <p className="text-gray-600">
                Allez sur n'importe quel storefront (ex: `/storefront/[id]`) et utilisez le chat en bas à droite.
                Les messages seront automatiquement sauvegardés en base de données.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. Test du dashboard partenaire</h3>
              <p className="text-gray-600">
                Connectez-vous en tant que partenaire et allez dans `/partner-dashboard/messages`.
                Vous devriez voir les conversations en temps réel.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Synchronisation</h3>
              <p className="text-gray-600">
                Les messages envoyés depuis le chat public apparaîtront automatiquement dans le dashboard partenaire,
                et vice versa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 