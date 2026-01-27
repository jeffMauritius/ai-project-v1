'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ShareButtonProps {
  title?: string;
  url?: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'ghost' | 'outline' | 'default';
  showText?: boolean;
}

export function ShareButton({
  title,
  url,
  className,
  size = 'default',
  variant = 'outline',
  showText = false,
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const currentTitle = title || (typeof document !== 'undefined' ? document.title : '');

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSharing(true);
    
    try {
      // Method 1: Use Web Share API (mobile)
      if ('share' in navigator && navigator.canShare()) {
        await navigator.share({
          title: currentTitle,
          url: currentUrl,
        });
        showSuccessNotification();
        return;
      }
      
      // Method 2: Copy to clipboard and show success
      await copyToClipboardAndNotify();
      
    } catch (error) {
      console.error('Error sharing:', error);
      await copyToClipboardAndNotify();
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboardAndNotify = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      showSuccessNotification();
    } catch (error) {
      console.error('Clipboard failed:', error);
      // Fallback: show simple success
      setIsSharing(false);
    }
  };

  const showSuccessNotification = () => {
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
    // Create elements safely to prevent XSS
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'display: flex; align-items: center; gap: 8px;';
    const iconSpan = document.createElement('span');
    iconSpan.style.fontSize = '16px';
    iconSpan.textContent = '📤';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = 'Lien partagé !';
    headerDiv.appendChild(iconSpan);
    headerDiv.appendChild(titleSpan);

    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = 'font-size: 12px; margin-top: 4px; opacity: 0.9;';
    messageDiv.textContent = 'URL copiée dans le presse-papiers';

    successDiv.appendChild(headerDiv);
    successDiv.appendChild(messageDiv);
    
    // Add animation styles if not already present
    if (!document.querySelector('#share-animation-styles')) {
      const style = document.createElement('style');
      style.id = 'share-animation-styles';
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
      className={cn(
        'transition-all duration-200',
        isSharing && 'opacity-50 cursor-not-allowed',
        variant === 'ghost' && 'hover:bg-white hover:text-pink-500',
        variant === 'default' && 'hover:bg-red-500 hover:text-white',
        variant === 'outline' && 'hover:bg-white hover:text-pink-500 hover:border-pink-500',
        className
      )}
      onClick={handleShare}
      disabled={isSharing}
      aria-label="Partager"
    >
      <Share2
        className={cn(
          'transition-all duration-200',
          showText && 'mr-2'
        )}
      />
      {showText && (
        <span>
          {isSharing ? 'Partage...' : 'Partager'}
        </span>
      )}
    </Button>
  );
} 