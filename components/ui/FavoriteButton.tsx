'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface FavoriteButtonProps {
  storefrontId?: string;
  name?: string;
  location?: string;
  rating?: number;
  numberOfReviews?: number;
  description?: string;
  imageUrl?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  showText?: boolean;
}

export function FavoriteButton({
  storefrontId,
  name,
  location,
  rating = 0,
  numberOfReviews = 0,
  description = "",
  imageUrl,
  className,
  size = 'default',
  variant = 'ghost',
  showText = false,
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si c'est déjà un favori au chargement
  useEffect(() => {
    if (session?.user && storefrontId) {
      checkIfFavorite();
    }
  }, [session, storefrontId, checkIfFavorite]);

  const checkIfFavorite = useCallback(async () => {
    try {
      const response = await fetch('/api/favorites');
      if (response.ok) {
        const favorites = await response.json();
        const isFav = favorites.some((fav: any) => fav.storefrontId === storefrontId);
        setIsFavorite(isFav);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error);
    }
  }, [storefrontId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!session?.user) {
      // Rediriger vers la page de connexion
      window.location.href = '/auth/login';
      return;
    }

    if (!storefrontId) {
      console.error('storefrontId manquant');
      return;
    }

    setIsLoading(true);

    try {
      if (isFavorite) {
        // Supprimer des favoris
        const response = await fetch(`/api/favorites?storefrontId=${storefrontId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setIsFavorite(false);
          showNotification('Retiré des favoris !', false);
          
          // Mettre à jour le statut de la vitrine consultée
          try {
            console.log('[FAVORITE_BUTTON] Mise à jour du statut - action: remove, storefrontId:', storefrontId)
            const response = await fetch('/api/consulted-storefronts/update-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storefrontId,
                name,
                action: 'remove'
              }),
            });
            console.log('[FAVORITE_BUTTON] Réponse mise à jour statut:', response.status, response.ok)
          } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
          }
        } else {
          console.error('Erreur lors de la suppression du favori');
        }
      } else {
        // Ajouter aux favoris
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storefrontId,
            name,
            location,
            rating,
            numberOfReviews,
            description,
            imageUrl,
          }),
        });

        if (response.ok) {
          setIsFavorite(true);
          showNotification('Ajouté aux favoris !', true);
          
          // Mettre à jour le statut de la vitrine consultée
          try {
            console.log('[FAVORITE_BUTTON] Mise à jour du statut - action: add, storefrontId:', storefrontId)
            const response = await fetch('/api/consulted-storefronts/update-status', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                storefrontId,
                name,
                action: 'add'
              }),
            });
            console.log('[FAVORITE_BUTTON] Réponse mise à jour statut:', response.status, response.ok)
          } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
          }
        } else if (response.status === 409) {
          showNotification('Déjà dans vos favoris !', true);
          setIsFavorite(true);
        } else {
          console.error('Erreur lors de l\'ajout aux favoris');
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message: string, isSuccess: boolean) => {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${isSuccess ? '#000000' : '#dc2626'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid ${isSuccess ? '#ec4899' : '#dc2626'};
    `;
    successDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${isSuccess ? '💖' : '💔'}</span>
        <span>${message}</span>
      </div>
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(successDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
      successDiv.style.animation = 'slideOut 0.3s ease-in';
      successDiv.style.animationFillMode = 'forwards';
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 300);
    }, 3000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      disabled={isLoading}
      className={cn(
        'transition-all duration-200',
        isFavorite && 'text-red-500 hover:text-red-600',
        !isFavorite && 'text-gray-500 hover:text-red-500',
        variant === 'ghost' && 'hover:bg-white hover:text-black',
        variant === 'default' && 'hover:bg-red-500 hover:text-white',
        variant === 'outline' && 'hover:bg-red-500 hover:text-white hover:border-red-500',
        className
      )}
      onClick={handleClick}
      aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          isFavorite ? 'fill-current' : 'fill-none',
          showText && 'mr-2'
        )}
      />
      {showText && (
        <span>
          {isLoading ? '...' : 'Ajouter aux favoris'}
        </span>
      )}
    </Button>
  );
} 