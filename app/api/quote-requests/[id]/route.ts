import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { QuoteRequestStatus } from '@prisma/client';

// PUT - Mettre à jour une demande de devis
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(QuoteRequestStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Vérifier que la demande appartient bien au partenaire
    const quoteRequest = await prisma.quoteRequest.findUnique({
      where: { id },
      include: {
        storefront: {
          include: {
            partner: true
          }
        }
      }
    });

    if (!quoteRequest) {
      return NextResponse.json(
        { error: 'Demande de devis non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que le partenaire possède cette vitrine
    if (quoteRequest.storefront?.partner?.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cette demande' },
        { status: 403 }
      );
    }

    // Mettre à jour le statut
    const updatedQuoteRequest = await prisma.quoteRequest.update({
      where: { id },
      data: { 
        status,
        updatedAt: new Date()
      }
    });

    return NextResponse.json(updatedQuoteRequest);

  } catch (error) {
    console.error('[QUOTE-REQUEST-UPDATE] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

