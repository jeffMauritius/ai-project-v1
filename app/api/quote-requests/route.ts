import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Récupérer toutes les demandes de devis pour le partenaire connecté
export async function GET(request: NextRequest) {
  try {
    console.log('[QUOTE-REQUESTS] Début de la requête GET');
    
    // Vérifier que l'utilisateur est connecté
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.log('[QUOTE-REQUESTS] Utilisateur non connecté');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    console.log('[QUOTE-REQUESTS] Utilisateur:', session.user.email);

    // Récupérer le partenaire de l'utilisateur connecté
    const partner = await prisma.partner.findFirst({
      where: {
        userId: session.user.id
      },
      include: {
        storefronts: {
          select: {
            id: true
          }
        }
      }
    });

    if (!partner || !partner.storefronts || partner.storefronts.length === 0) {
      console.log('[QUOTE-REQUESTS] Aucune vitrine trouvée pour ce partenaire');
      return NextResponse.json([]);
    }

    console.log('[QUOTE-REQUESTS] Vitrine(s) trouvée(s):', partner.storefronts.map(s => s.id));

    // Récupérer toutes les demandes de devis pour les vitrines du partenaire
    const storefrontIds = partner.storefronts.map(s => s.id);
    
    const quoteRequests = await prisma.quoteRequest.findMany({
      where: {
        storefrontId: {
          in: storefrontIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log('[QUOTE-REQUESTS] Demandes trouvées:', quoteRequests.length);

    return NextResponse.json(quoteRequests);

  } catch (error) {
    console.error('[QUOTE-REQUESTS] Erreur détaillée:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

