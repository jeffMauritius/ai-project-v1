import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store des connexions SSE
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const userId = session.user.id
  const conversationId = request.nextUrl.searchParams.get('conversationId')

  if (!conversationId) {
    return new NextResponse('Missing conversationId', { status: 400 })
  }

  console.log(`🔌 Nouvelle connexion SSE pour ${userId} dans ${conversationId}`)

  const stream = new ReadableStream({
    start(controller) {
      const connectionKey = `${userId}-${conversationId}`
      
      // Fermer l'ancienne connexion si elle existe
      const existingConnection = connections.get(connectionKey)
      if (existingConnection) {
        try {
          existingConnection.close()
        } catch (error) {
          console.log('Ancienne connexion déjà fermée')
        }
      }
      
      connections.set(connectionKey, controller)
      console.log(`🔌 Connexion SSE stockée: ${connectionKey}`)

      // Envoyer un message de connexion
      controller.enqueue(`data: ${JSON.stringify({
        type: 'connected',
        message: 'Connexion établie'
      })}\n\n`)

      // Nettoyer la connexion quand elle se ferme
      request.signal.addEventListener('abort', () => {
        console.log(`🔌 Connexion SSE fermée pour ${userId}`)
        connections.delete(connectionKey)
      })
    },
    cancel() {
      const connectionKey = `${userId}-${conversationId}`
      console.log(`🔌 Connexion SSE annulée: ${connectionKey}`)
      connections.delete(connectionKey)
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}

// Fonction pour diffuser un message à tous les participants d'une conversation
export function broadcastMessage(conversationId: string, message: any) {
  console.log(`📢 Diffusion du message dans ${conversationId}:`, message)
  console.log(`🔍 Connexions actives AVANT diffusion:`, Array.from(connections.keys()))
  
  const messageData = `data: ${JSON.stringify({
    type: 'new-message',
    ...message
  })}\n\n`

  // Diffuser à toutes les connexions de cette conversation
  let broadcastCount = 0
  
  for (const [connectionKey, controller] of connections.entries()) {
    console.log(`🔍 Vérification de la connexion: ${connectionKey}`)
    // La clé est formatée comme "userId-conversationId"
    if (connectionKey.endsWith(`-${conversationId}`)) {
      try {
        controller.enqueue(messageData)
        broadcastCount++
        console.log(`📤 Message diffusé à ${connectionKey}`)
      } catch (error) {
        console.error('Erreur lors de la diffusion:', error)
        connections.delete(connectionKey)
      }
    }
  }
  
  console.log(`📊 Total de ${broadcastCount} connexions ont reçu le message`)
  console.log(`🔍 Connexions actives APRÈS diffusion:`, Array.from(connections.keys()))
  
  if (broadcastCount === 0) {
    console.log(`❌ Aucune connexion active pour la conversation ${conversationId}`)
  }
}