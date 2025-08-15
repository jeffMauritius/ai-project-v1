import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    console.log('[QUOTE-REQUEST] Début de la requête');
    
    // Vérifier que l'utilisateur est connecté
    const session = await getServerSession(authOptions);
    console.log('[QUOTE-REQUEST] Session:', session ? { 
      userId: session.user?.id, 
      userEmail: session.user?.email, 
      userRole: session.user?.role 
    } : 'null');
    
    if (!session?.user) {
      console.log('[QUOTE-REQUEST] Utilisateur non connecté');
      return NextResponse.json(
        { error: 'Vous devez être connecté pour envoyer une demande de devis' },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log('[QUOTE-REQUEST] Body reçu:', body);
    
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

    console.log('[QUOTE-REQUEST] Vérification de la vitrine partenaire:', storefrontId);
    
    // Vérifier que la vitrine partenaire existe (vers laquelle l'utilisateur envoie sa demande)
    const storefront = await prisma.partnerStorefront.findUnique({
      where: { id: storefrontId },
      include: { user: true }
    });
    
    if (!storefront) {
      console.log('[QUOTE-REQUEST] Vitrine partenaire non trouvée:', storefrontId);
      return NextResponse.json(
        { error: 'Vitrine partenaire non trouvée' },
        { status: 400 }
      );
    }
    
    console.log('[QUOTE-REQUEST] Vitrine partenaire trouvée:', { 
      storefrontId: storefront.id, 
      companyName: storefront.companyName,
      partnerEmail: storefront.user?.email 
    });
    
    // Email du partenaire qui recevra la demande
    const recipientEmail = storefrontEmail || storefront.user?.email;
    
    if (!recipientEmail) {
      console.log('[QUOTE-REQUEST] Email du prestataire non trouvé');
      return NextResponse.json(
        { error: 'Email du prestataire non trouvé' },
        { status: 400 }
      );
    }

    console.log('[QUOTE-REQUEST] Création de la demande de devis...');
    
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
    
    console.log('[QUOTE-REQUEST] Demande créée avec succès:', quoteRequest.id);

    // Log de la demande de devis
    console.log('Quote Request Received:', {
      quoteRequestId: quoteRequest.id,
      from: `${session.user.name} (${session.user.email})`,
      to: recipientEmail,
      storefront: storefrontName,
      eventDate,
      guestCount,
      eventType,
      venueLocation,
      budget,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis envoyée avec succès',
      quoteRequestId: quoteRequest.id 
    });

  } catch (error) {
    console.error('[QUOTE-REQUEST] Erreur détaillée:', error);
    console.error('[QUOTE-REQUEST] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 