import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté et est un partenaire
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'PARTNER') {
      return NextResponse.json(
        { error: 'Accès réservé aux partenaires' },
        { status: 403 }
      );
    }

    // Récupérer les conversations en temps réel pour ce partenaire
    const conversations = await prisma.conversation.findMany({
      where: {
        partnerId: session.user.id
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1 // Dernier message seulement
        },
        storefront: {
          select: {
            companyName: true,
            type: true
          }
        },
        quoteRequest: {
          select: {
            id: true,
            status: true,
            eventDate: true,
            guestCount: true,
            eventType: true,
            venueLocation: true,
            budget: true,
            message: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[0];
      const clientName = `${conv.client.firstName} ${conv.client.lastName}`;
      
      return {
        id: conv.id,
        client: {
          name: clientName,
          avatar: `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80`,
          type: conv.storefront?.type === 'VENUE' ? 'Lieu' : conv.storefront?.type || 'Prestataire'
        },
        messages: conv.messages.map(msg => ({
          id: msg.id,
          sender: msg.senderId === session.user.id ? 'partner' as const : 'client' as const,
          content: msg.content,
          date: msg.createdAt.toISOString(),
          read: msg.read
        })),
        lastMessage: lastMessage?.content || 'Aucun message',
        date: conv.lastMessageAt.toISOString(),
        unread: conv.unreadCount > 0,
        quoteRequest: conv.quoteRequest ? {
          id: conv.quoteRequest.id,
          status: conv.quoteRequest.status,
          eventDate: conv.quoteRequest.eventDate,
          guestCount: conv.quoteRequest.guestCount,
          eventType: conv.quoteRequest.eventType,
          venueLocation: conv.quoteRequest.venueLocation,
          budget: conv.quoteRequest.budget,
          message: conv.quoteRequest.message,
          customerEmail: conv.client.email,
          customerName: clientName
        } : null
      };
    });

    return NextResponse.json({ conversations: formattedConversations });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 