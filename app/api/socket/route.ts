import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  // Cette route sert juste à vérifier que l'endpoint fonctionne
  return new Response(JSON.stringify({ 
    message: 'Socket.io endpoint is ready',
    status: 'connected'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}