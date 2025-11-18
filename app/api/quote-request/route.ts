import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {

    // Vérifier que l'utilisateur est connecté
    const session = await getServerSession(authOptions);

    if (!session?.user) {

      return NextResponse.json(
        { error: 'Vous devez être connecté pour envoyer une demande de devis' },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      eventDate,
      guestCount,
      eventType,
      venueLocation,
      budget,
      message,
      storefrontId,
      storefrontName,
      storefrontEmail,
    } = body;

    // Validate required fields
    if (!eventDate || !guestCount || !eventType || !venueLocation || !budget) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Vérifier que la vitrine partenaire existe (vers laquelle l'utilisateur envoie sa demande)
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id: storefrontId },
      include: { 
        partner: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!storefront) {

      return NextResponse.json(
        { error: 'Vitrine partenaire non trouvée' },
        { status: 400 }
      );
    }

    // Email du partenaire qui recevra la demande
    const recipientEmail = storefrontEmail || storefront.partner?.user?.email;
    
    if (!recipientEmail) {

      return NextResponse.json(
        { error: 'Email du prestataire non trouvé' },
        { status: 400 }
      );
    }

    // Create quote request record in database
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        // Utiliser les informations de l'utilisateur connecté
        firstName: session.user.name?.split(' ')[0] || 'Utilisateur',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || 'MonMariage.ai',
        email: session.user.email || '',
        phone: null, // Pas de téléphone dans le nouveau formulaire
        eventDate: new Date(eventDate),
        guestCount,
        eventType,
        venueLocation,
        budget,
        message: message || null,
        storefrontId,
        status: 'PENDING',
      },
    });

    // Log de la demande de devis

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis envoyée avec succès',
      quoteRequestId: quoteRequest.id 
    });

  } catch (error) {
    console.error('[QUOTE-REQUEST] Erreur détaillée:', error);
    console.error('[QUOTE-REQUEST] Type d\'erreur:', typeof error);
    console.error('[QUOTE-REQUEST] Message d\'erreur:', error instanceof Error ? error.message : String(error));
    console.error('[QUOTE-REQUEST] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    
    // Retourner l'erreur spécifique en développement
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        { 
          error: 'Erreur interne du serveur',
          details: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 