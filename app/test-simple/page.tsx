'use client';

import { FavoriteButton } from '@/components/ui/FavoriteButton';

export default function TestSimplePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Test Simple</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Test 1: Simple button</h2>
          <button 
            onClick={() => alert('Regular button works!')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Test Regular Button
          </button>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Test 2: Favorite button</h2>
          <FavoriteButton 
            url="https://example.com"
            title="Test"
            showText={true}
          />
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Test 3: Icon only</h2>
          <FavoriteButton 
            url="https://example.com"
            title="Test"
            size="icon"
            className="bg-red-100"
          />
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-100 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Open browser console (F12)</li>
          <li>Click the buttons above</li>
          <li>You should see console messages and alerts</li>
        </ul>
      </div>
    </div>
  );
} 