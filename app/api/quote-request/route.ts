import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendMail } from '@/lib/email';

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
    // Si l'email du prestataire n'est pas disponible, utiliser les emails de fallback
    const FALLBACK_EMAILS = ['jfroussel75@gmail.com', 'arnaud@monmariage.ai'];
    const partnerEmail = storefrontEmail || storefront.partner?.user?.email;
    const isUsingFallback = !partnerEmail;

    // Construire les informations de référence si fallback
    const partnerName = storefront.partner?.companyName || storefrontName || 'Prestataire inconnu';
    const storefrontType = storefront.type; // 'VENUE' ou 'PARTNER'

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

    // Log de la demande de devis avec informations de référence
    if (isUsingFallback) {
      console.log('[QUOTE-REQUEST] ⚠️ Email prestataire non disponible - Utilisation du fallback');
      console.log('[QUOTE-REQUEST] 📧 Emails de destination:', FALLBACK_EMAILS);
      console.log('[QUOTE-REQUEST] 📋 Référence demande:', {
        quoteRequestId: quoteRequest.id,
        storefrontId: storefrontId,
        storefrontType: storefrontType,
        partnerName: partnerName,
        clientId: session.user.id,
        clientEmail: session.user.email,
        clientName: session.user.name,
      });

      // Envoyer un email à tous les fallbacks avec les informations de référence
      const typeLabel = storefrontType === 'VENUE' ? 'Lieu' : 'Prestataire';
      const emailHtml = `
        <h2>Nouvelle demande de devis</h2>
        <p><strong>⚠️ Email du prestataire non disponible</strong></p>

        <h3>Informations de référence</h3>
        <ul>
          <li><strong>ID Demande:</strong> ${quoteRequest.id}</li>
          <li><strong>Type:</strong> ${typeLabel}</li>
          <li><strong>Nom du ${typeLabel.toLowerCase()}:</strong> ${partnerName}</li>
          <li><strong>ID Storefront:</strong> ${storefrontId}</li>
        </ul>

        <h3>Client</h3>
        <ul>
          <li><strong>ID Client:</strong> ${session.user.id}</li>
          <li><strong>Nom:</strong> ${session.user.name || 'Non renseigné'}</li>
          <li><strong>Email:</strong> ${session.user.email || 'Non renseigné'}</li>
        </ul>

        <h3>Détails de la demande</h3>
        <ul>
          <li><strong>Date de l'événement:</strong> ${new Date(eventDate).toLocaleDateString('fr-FR')}</li>
          <li><strong>Nombre d'invités:</strong> ${guestCount}</li>
          <li><strong>Type d'événement:</strong> ${eventType}</li>
          <li><strong>Lieu:</strong> ${venueLocation}</li>
          <li><strong>Budget:</strong> ${budget}</li>
        </ul>

        ${message ? `<h3>Message du client</h3><p>${message}</p>` : ''}

        <hr>
        <p><em>Email envoyé automatiquement car l'email du prestataire n'est pas configuré.</em></p>
      `;

      // Envoyer à tous les emails de fallback
      for (const fallbackEmail of FALLBACK_EMAILS) {
        try {
          await sendMail({
            to: fallbackEmail,
            subject: `[MonMariage.ai] Nouvelle demande de devis - ${partnerName}`,
            html: emailHtml
          });
          console.log('[QUOTE-REQUEST] 📧 Email envoyé à:', fallbackEmail);
        } catch (emailError) {
          console.error('[QUOTE-REQUEST] ❌ Erreur envoi email à', fallbackEmail, ':', emailError);
        }
      }
    } else {
      console.log('[QUOTE-REQUEST] ✅ Demande enregistrée pour:', partnerEmail);
    }

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