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

    // Récupérer les demandes de devis pour ce partenaire
    const quoteRequests = await prisma.quoteRequest.findMany({
      where: {
        storefront: {
          userId: session.user.id
        }
      },
      include: {
        storefront: {
          select: {
            companyName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformer les données pour correspondre au format attendu par le frontend
    const conversations = quoteRequests.map((request, index) => ({
      id: request.id,
      client: {
        name: `${request.firstName} ${request.lastName}`,
        avatar: `https://images.unsplash.com/photo-${1500000000000 + index}?ixlib=rb-1.2.1&auto=format&fit=crop&w=80&h=80&q=80`,
        type: `${request.eventType} ${new Date(request.eventDate).getFullYear()}`
      },
      messages: [
        {
          id: 1,
          sender: 'client' as const,
          content: `Demande de devis pour ${request.eventType} le ${new Date(request.eventDate).toLocaleDateString('fr-FR')} avec ${request.guestCount} invités.${request.message ? `\n\nMessage: ${request.message}` : ''}`,
          date: request.createdAt.toISOString(),
          read: request.status !== 'PENDING'
        }
      ],
      lastMessage: `Demande de devis pour ${request.eventType} le ${new Date(request.eventDate).toLocaleDateString('fr-FR')} avec ${request.guestCount} invités.`,
      date: request.createdAt.toISOString(),
      unread: request.status === 'PENDING',
      quoteRequest: {
        id: request.id,
        status: request.status,
        eventDate: request.eventDate,
        guestCount: request.guestCount,
        eventType: request.eventType,
        venueLocation: request.venueLocation,
        budget: request.budget,
        message: request.message,
        customerEmail: request.email,
        customerName: `${request.firstName} ${request.lastName}`
      }
    }));

    return NextResponse.json({ conversations });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 