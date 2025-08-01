# Système de Gestion des Erreurs - MonMariage.AI

## Vue d'ensemble

Ce document décrit le système de gestion des erreurs amélioré pour l'application MonMariage.AI, qui remplace l'affichage basique des erreurs par des notifications toast et des alertes dialog plus élégantes.

## Composants Principaux

### 1. Hook `useToast` (`hooks/useToast.ts`)

Un hook personnalisé qui fournit des méthodes pour afficher différents types de notifications :

```typescript
const { 
  showSuccess, 
  showError, 
  showWarning, 
  showInfo, 
  showSubscriptionError,
  showSubscriptionAlert 
} = useToast()
```

#### Méthodes disponibles :

- **`showSuccess(message, options?)`** : Affiche une notification de succès
- **`showError(message, options?)`** : Affiche une notification d'erreur
- **`showWarning(message, options?)`** : Affiche une notification d'avertissement
- **`showInfo(message, options?)`** : Affiche une notification d'information
- **`showSubscriptionError(errorMessage)`** : Gère spécifiquement les erreurs d'abonnement
- **`showSubscriptionAlert(options)`** : Retourne les props pour l'alerte dialog

### 2. Composant `SubscriptionErrorAlert` (`components/SubscriptionErrorAlert.tsx`)

Un composant d'alerte dialog spécialisé pour les erreurs d'abonnement importantes.

#### Types d'erreurs supportés :

- `existing_subscription` : Abonnement existant
- `payment_error` : Erreur de paiement
- `general_error` : Erreur générale

## Utilisation

### Exemple basique avec Toast

```typescript
import { useToast } from '@/hooks/useToast'

export function MonComposant() {
  const { showSuccess, showError } = useToast()

  const handleAction = async () => {
    try {
      // Votre logique ici
      showSuccess("Opération réussie !")
    } catch (error) {
      showError("Une erreur s'est produite")
    }
  }
}
```

### Exemple avec Alerte Dialog

```typescript
import { useToast } from '@/hooks/useToast'
import { SubscriptionErrorAlert } from '@/components/SubscriptionErrorAlert'

export function MonComposant() {
  const [showAlert, setShowAlert] = useState(false)
  const [alertProps, setAlertProps] = useState(null)
  const { showSubscriptionAlert } = useToast()

  const handleSubscriptionError = (error) => {
    if (error.includes("Un abonnement actif existe déjà")) {
      const props = showSubscriptionAlert({
        errorType: 'existing_subscription',
        onAction: () => {
          setShowAlert(false)
          // Navigation vers la gestion d'abonnement
        },
        actionLabel: "Gérer mon abonnement"
      })
      setAlertProps(props)
      setShowAlert(true)
    }
  }

  return (
    <>
      {/* Votre contenu */}
      
      {showAlert && alertProps && (
        <SubscriptionErrorAlert
          isOpen={showAlert}
          onClose={() => setShowAlert(false)}
          {...alertProps}
        />
      )}
    </>
  )
}
```

## Gestion des Erreurs d'API

### Hook `useSubscription` modifié

Le hook `useSubscription` a été modifié pour :

1. **Supprimer l'état `error`** : Les erreurs ne sont plus stockées dans l'état
2. **Propager les erreurs** : Les erreurs sont propagées via les exceptions
3. **Gestion côté client** : Chaque composant gère ses propres erreurs

### Exemple d'utilisation

```typescript
const { createSubscription } = useSubscription()
const { showSubscriptionError } = useToast()

const handleCreateSubscription = async () => {
  try {
    await createSubscription(planId, billingInterval, billingInfo)
    showSuccess("Abonnement créé avec succès !")
  } catch (error) {
    showSubscriptionError(error.message)
  }
}
```

## Personnalisation

### Options de Toast

```typescript
interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}
```

### Options d'Alerte

```typescript
interface AlertOptions {
  errorType: 'existing_subscription' | 'payment_error' | 'general_error'
  errorMessage?: string
  onAction?: () => void
  actionLabel?: string
}
```

## Avantages

1. **UX améliorée** : Notifications plus élégantes et informatives
2. **Gestion centralisée** : Logique d'erreur centralisée dans le hook
3. **Flexibilité** : Choix entre toast et alerte dialog selon l'importance
4. **Accessibilité** : Composants basés sur Radix UI pour une meilleure accessibilité
5. **Maintenabilité** : Code plus propre et réutilisable

## Migration

Pour migrer du système d'erreur basique vers le nouveau système :

1. Remplacer `error` par `showError()` dans les composants
2. Utiliser `showSubscriptionError()` pour les erreurs d'abonnement
3. Ajouter `SubscriptionErrorAlert` pour les erreurs importantes
4. Supprimer les affichages d'erreur basiques (`<p className="text-red-500">`)

## Exemples de Messages d'Erreur

### Erreurs d'Abonnement

- **Abonnement existant** : "Vous avez déjà un abonnement actif. Vous pouvez modifier votre plan actuel ou annuler votre abonnement existant."
- **Erreur de paiement** : "Une erreur s'est produite lors du traitement du paiement. Veuillez vérifier vos informations de paiement et réessayer."
- **Erreur générale** : "Une erreur inattendue s'est produite. Veuillez réessayer plus tard."

### Messages de Succès

- **Création d'abonnement** : "Votre abonnement a été créé avec succès. Vous bénéficiez d'un essai gratuit de 14 jours."
- **Annulation d'abonnement** : "Votre abonnement sera annulé à la fin de la période actuelle. Vous continuerez à bénéficier de vos services jusqu'à cette date." 