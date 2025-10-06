import { io } from 'socket.io-client'

async function testSocketIO() {
  console.log('🔌 Test de connexion Socket.IO...')
  
  const socket = io('http://localhost:3000', {
    path: '/api/socketio',
    transports: ['websocket', 'polling'],
    timeout: 20000,
  })

  socket.on('connect', () => {
    console.log('✅ Connexion Socket.IO établie:', socket.id)
    
    // Test d'envoi de message
    const testMessage = {
      conversationId: '68d789dfebfe40a2a8688f04',
      content: 'Test message from script',
      senderType: 'provider',
      senderName: 'Test Partner',
      senderEmail: 'test@partner.com'
    }
    
    console.log('📤 Envoi du message de test:', testMessage)
    socket.emit('new-message', testMessage)
  })

  socket.on('new-message', (message) => {
    console.log('📨 Message reçu:', message)
  })

  socket.on('error', (error) => {
    console.error('❌ Erreur Socket.IO:', error)
  })

  socket.on('connect_error', (error) => {
    console.error('❌ Erreur de connexion:', error.message)
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Déconnexion:', reason)
  })

  // Attendre 5 secondes puis fermer
  setTimeout(() => {
    console.log('🔌 Fermeture de la connexion...')
    socket.disconnect()
    process.exit(0)
  }, 5000)
}

testSocketIO().catch(console.error)
