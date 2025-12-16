'use client';

import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AddToOrganizationButtonProps {
  storefrontId: string;
  name: string;
  serviceType: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  showText?: boolean;
}

// Mapping des types de service vers les types de prestataires du planning
const serviceTypeToProviderType: Record<string, string> = {
  'LIEU': 'venues',
  'TRAITEUR': 'caterers',
  'PHOTOGRAPHE': 'photographers',
  'VIDEO': 'videographers',
  'FLORISTE': 'florists',
  'DECORATION': 'decorators',
  'MUSIQUE': 'music-vendors',
  'ANIMATION': 'entertainment',
  'WEDDING_CAKE': 'wedding-cakes',
  'VIN': 'wine-spirits',
  'VOITURE': 'transport',
  'BUS': 'transport',
  'CADEAUX_INVITES': 'gifts',
  'LUNE_DE_MIEL': 'honeymoon',
  'OFFICIANT': 'officiants',
  'ORGANISATION': 'organization',
  'CHAPITEAU': 'venues',
  'FAIRE_PART': 'invitations',
  'FOOD_TRUCK': 'caterers',
  'LISTE': 'gifts',
};

export function AddToOrganizationButton({
  storefrontId,
  name,
  serviceType,
  className,
  size = 'default',
  variant = 'outline',
  showText = false,
}: AddToOrganizationButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleAddToOrganization = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (status !== 'authenticated') {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.href));
      return;
    }

    setIsAdding(true);

    try {
      // Convertir le type de service en type de prestataire pour le planning
      const providerType = serviceTypeToProviderType[serviceType] || 'venues';

      // Obtenir la date du jour au format français dd/mm/yyyy
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = today.getFullYear();
      const dateString = `${day}/${month}/${year}`;

      const response = await fetch('/api/wedding-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: name,
          type: providerType,
          date: dateString,
          status: 'pending',
          price: '0',
          deposit: '0',
          notes: `Ajouté depuis la vitrine (ID: ${storefrontId})`
        }),
      });

      if (response.ok) {
        showSuccessNotification();
        // Optionnel: rediriger vers la page planning après un délai
        setTimeout(() => {
          router.push('/dashboard/planning');
        }, 2000);
      } else {
        const errorData = await response.json();
        showErrorNotification(errorData.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      showErrorNotification('Erreur de connexion');
    } finally {
      setIsAdding(false);
    }
  };

  const showSuccessNotification = () => {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000000;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid #22c55e;
    `;
    successDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">✓</span>
        <span>Ajouté à votre organisation !</span>
      </div>
      <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
        Redirection vers votre planning...
      </div>
    `;

    if (!document.querySelector('#organization-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'organization-animation-styles';
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
    }

    document.body.appendChild(successDiv);

    setTimeout(() => {
      successDiv.style.animation = 'slideOut 0.3s ease-in';
      successDiv.style.animationFillMode = 'forwards';
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 300);
    }, 1800);
  };

  const showErrorNotification = (message: string) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #000000;
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid #ef4444;
    `;
    errorDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">✗</span>
        <span>Erreur</span>
      </div>
      <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
        ${message}
      </div>
    `;

    document.body.appendChild(errorDiv);

    setTimeout(() => {
      errorDiv.style.animation = 'slideOut 0.3s ease-in';
      errorDiv.style.animationFillMode = 'forwards';
      setTimeout(() => {
        if (document.body.contains(errorDiv)) {
          document.body.removeChild(errorDiv);
        }
      }, 300);
    }, 3000);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isAdding && 'opacity-50 cursor-not-allowed',
        variant === 'ghost' && 'hover:bg-white hover:text-pink-500',
        variant === 'default' && 'hover:bg-pink-700 hover:text-white',
        variant === 'outline' && 'hover:bg-white hover:text-pink-500 hover:border-pink-500',
        className
      )}
      onClick={handleAddToOrganization}
      disabled={isAdding}
      aria-label="Ajouter à mon organisation"
    >
      <CalendarPlus
        className={cn(
          'transition-all duration-200',
          showText && 'mr-2'
        )}
      />
      {showText && (
        <span>
          {isAdding ? 'Ajout...' : 'Ajouter à mon organisation'}
        </span>
      )}
    </Button>
  );
}
