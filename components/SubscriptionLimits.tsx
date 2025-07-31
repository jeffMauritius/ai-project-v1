'use client'

import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Camera, AlertTriangle, Crown } from 'lucide-react'
import Link from 'next/link'

interface SubscriptionLimitsProps {
  photoCount?: number
  maxPhotos?: number | null
  showUpgradePrompt?: boolean
}

export function SubscriptionLimits({ 
  photoCount = 0, 
  maxPhotos = null, 
  showUpgradePrompt = false 
}: SubscriptionLimitsProps) {
  const { subscription, plans } = useSubscription()

  if (!subscription) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Aucun abonnement actif. 
          <Link href="/partner-dashboard/subscription" className="ml-1 text-blue-600 hover:underline">
            Choisir un plan
          </Link>
        </AlertDescription>
      </Alert>
    )
  }

  const isUnlimited = maxPhotos === null
  const usagePercentage = isUnlimited ? 0 : (photoCount / maxPhotos) * 100
  const isNearLimit = !isUnlimited && usagePercentage >= 80
  const isAtLimit = !isUnlimited && photoCount >= maxPhotos

  return (
    <div className="space-y-4">
      {/* Affichage de l'utilisation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            Utilisation des photos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Photos utilisées
              </span>
              <span className="font-medium">
                {photoCount} {isUnlimited ? '' : `/ ${maxPhotos}`}
              </span>
            </div>
            
            {!isUnlimited && (
              <Progress 
                value={usagePercentage} 
                className={`h-2 ${isNearLimit ? 'bg-orange-100' : ''}`}
              />
            )}

            {isUnlimited && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Crown className="h-4 w-4" />
                Photos illimitées
              </div>
            )}

            {isNearLimit && !isAtLimit && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Vous approchez de la limite de photos ({Math.round(usagePercentage)}% utilisées).
                  {showUpgradePrompt && (
                    <Link href="/partner-dashboard/subscription" className="ml-1 text-orange-700 hover:underline font-medium">
                      Passer au plan supérieur
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {isAtLimit && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Limite de photos atteinte ({photoCount}/{maxPhotos}).
                  {showUpgradePrompt && (
                    <Link href="/partner-dashboard/subscription" className="ml-1 text-red-700 hover:underline font-medium">
                      Passer au plan supérieur pour plus de photos
                    </Link>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan actuel */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Plan actuel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{subscription.plan.name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription.plan.price}€ / {subscription.plan.billingInterval === 'YEARLY' ? 'an' : 'mois'}
              </p>
            </div>
            <Link href="/partner-dashboard/subscription">
              <Button variant="outline" size="sm">
                Gérer
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Suggestion d'upgrade */}
      {showUpgradePrompt && !isUnlimited && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
              <Crown className="h-5 w-5" />
              Passez au niveau supérieur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700 mb-3">
              Débloquez des photos illimitées et plus de fonctionnalités avec nos plans supérieurs.
            </p>
            <Link href="/partner-dashboard/subscription">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Voir les plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 