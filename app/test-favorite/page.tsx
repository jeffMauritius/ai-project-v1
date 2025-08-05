'use client';

import { FavoriteButton } from '@/components/ui/FavoriteButton';

export default function TestFavoritePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test du bouton favori</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Bouton simple</h2>
          <FavoriteButton 
            url="https://example.com"
            title="Page de test"
            showText={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Bouton avec icône seulement</h2>
          <FavoriteButton 
            url="https://example.com"
            title="Page de test"
            size="icon"
            className="bg-pink-100 hover:bg-pink-200"
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Bouton outline</h2>
          <FavoriteButton 
            url="https://example.com"
            title="Page de test"
            variant="outline"
            showText={true}
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">Instructions de test :</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Ouvrez la console du navigateur (F12)</li>
          <li>Cliquez sur un des boutons ci-dessus</li>
          <li>Vérifiez que vous voyez les messages de debug dans la console</li>
          <li>Sur mobile, le bouton devrait ouvrir le menu de partage</li>
          <li>Sur desktop, le bouton devrait afficher une modal avec des instructions</li>
        </ul>
      </div>
    </div>
  );
} 