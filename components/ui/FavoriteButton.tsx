'use client';

import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface FavoriteButtonProps {
  title?: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  showText?: boolean;
}

export function FavoriteButton({
  title,
  url,
  className,
  size = 'default',
  variant = 'ghost',
  showText = false,
}: FavoriteButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const currentUrl = url || window.location.href;
    const currentTitle = title || document.title;
    
    console.log('🔴 BUTTON CLICKED!');
    console.log('URL:', currentUrl);
    console.log('Title:', currentTitle);
    
    // Method 1: Try to directly add to bookmarks (works in some browsers)
    if ('addFavorite' in window) {
      try {
        (window as any).addFavorite(currentUrl, currentTitle);
        setIsBookmarked(true);
        setTimeout(() => setIsBookmarked(false), 2000);
        return;
      } catch (error) {
        console.log('addFavorite failed, trying other methods');
      }
    }
    
    // Method 2: Use Web Share API (mobile - works immediately)
    if ('share' in navigator && navigator.canShare()) {
      navigator.share({
        title: currentTitle,
        url: currentUrl,
      }).then(() => {
        setIsBookmarked(true);
        setTimeout(() => setIsBookmarked(false), 2000);
      }).catch(() => {
        // If share fails, try clipboard method
        copyToClipboardAndNotify();
      });
      return;
    }
    
    // Method 3: Copy to clipboard and show success (works immediately)
    copyToClipboardAndNotify();
  };

  const copyToClipboardAndNotify = async () => {
    const currentUrl = url || window.location.href;
    
    try {
      await navigator.clipboard.writeText(currentUrl);
      
      // Show success notification
      setIsBookmarked(true);
      
      // Create a temporary success message
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
        border-left: 4px solid #ec4899;
      `;
      successDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px;">💖</span>
          <span>Ajouté aux favoris !</span>
        </div>
        <div style="font-size: 12px; margin-top: 4px; opacity: 0.9;">
          URL copiée dans le presse-papiers
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
          document.body.removeChild(successDiv);
        }, 300);
      }, 3000);
      
      setTimeout(() => setIsBookmarked(false), 2000);
      
    } catch (error) {
      console.error('Clipboard failed:', error);
      
      // Fallback: show simple success
      setIsBookmarked(true);
      setTimeout(() => setIsBookmarked(false), 2000);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'transition-all duration-200',
        isBookmarked && 'text-red-500 hover:text-red-600',
        !isBookmarked && 'text-gray-500 hover:text-red-500',
        variant === 'ghost' && 'hover:bg-white hover:text-black',
        variant === 'default' && 'hover:bg-red-500 hover:text-white',
        variant === 'outline' && 'hover:bg-red-500 hover:text-white hover:border-red-500',
        className
      )}
      onClick={handleClick}
      aria-label="Ajouter aux favoris"
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          isBookmarked ? 'fill-current' : 'fill-none',
          showText && 'mr-2'
        )}
      />
      {showText && (
        <span>
          {isBookmarked ? 'Ajouté !' : 'Ajouter aux favoris'}
        </span>
      )}
    </Button>
  );
} 