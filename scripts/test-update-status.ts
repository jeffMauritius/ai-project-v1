async function testUpdateStatus() {
  try {
    console.log('🧪 Test de l\'API update-status...')

    // Test 1: Mettre à jour le statut d'une vitrine existante
    const response = await fetch('/api/consulted-storefronts/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storefrontId: '507f1f77bcf86cd799439016', // TRAITEUR 7
        name: 'TRAITEUR 7',
        action: 'add'
      }),
    })

    console.log('📡 Réponse API:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Données reçues:', data)
    } else {
      const errorText = await response.text()
      console.log('❌ Erreur:', errorText)
    }

  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
  }
}

// Note: Ce script doit être exécuté côté client (dans le navigateur)
// car il fait un appel fetch vers l'API
console.log('Pour tester, ouvrez la console du navigateur et exécutez:')
console.log('await testUpdateStatus()') 