import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Store des connexions SSE (en production, utiliser Redis)
const connections = new Map<string, ReadableStreamDefaultController>()

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const conversationId = searchParams.get('conversationId')

  if (!conversationId) {
    return new Response('Conversation ID required', { status: 400 })
  }

  // Créer un stream SSE
  const stream = new ReadableStream({
    start(controller) {
      const connectionId = `${session.user.id}-${conversationId}`
      connections.set(connectionId, controller)
      
      // Envoyer un message de connexion
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', conversationId })}\n\n`)

      // Nettoyer la connexion quand elle se ferme
      request.signal.addEventListener('abort', () => {
        connections.delete(connectionId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  })
}

// Fonction pour envoyer un message à une conversation spécifique
export function sendMessageToConversation(conversationId: string, message: any) {
  const messageData = `data: ${JSON.stringify({ type: 'new_message', ...message })}\n\n`
  
  // Envoyer à tous les clients connectés à cette conversation
  for (const [connectionId, controller] of connections) {
    if (connectionId.includes(conversationId)) {
      try {
        controller.enqueue(messageData)
      } catch (error) {
        // Connexion fermée, la supprimer
        connections.delete(connectionId)
      }
    }
  }
}



