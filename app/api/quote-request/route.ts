import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
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
    if (!firstName || !lastName || !email || !eventDate || !guestCount || !eventType) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    // Get storefront email if not provided
    let recipientEmail = storefrontEmail;
    if (!recipientEmail) {
      const storefront = await prisma.partnerStorefront.findUnique({
        where: { id: storefrontId },
        include: { user: true }
      });
      recipientEmail = storefront?.user?.email;
    }

    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email du prestataire non trouvé' },
        { status: 400 }
      );
    }

    // Create quote request record in database
    const quoteRequest = await prisma.quoteRequest.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        eventDate: new Date(eventDate),
        guestCount,
        eventType,
        venueLocation: venueLocation || null,
        budget: budget || null,
        message: message || null,
        storefrontId,
        status: 'PENDING',
      },
    });

    // Send email notification (you can implement your email service here)
    // For now, we'll just log the request
    console.log('Quote Request Received:', {
      quoteRequestId: quoteRequest.id,
      from: `${firstName} ${lastName} (${email})`,
      to: recipientEmail,
      storefront: storefrontName,
      eventDate,
      guestCount,
      eventType,
    });

    // TODO: Implement email sending
    // await sendQuoteRequestEmail({
    //   to: recipientEmail,
    //   from: email,
    //   subject: `Nouvelle demande de devis - ${storefrontName}`,
    //   data: {
    //     customerName: `${firstName} ${lastName}`,
    //     customerEmail: email,
    //     customerPhone: phone,
    //     eventDate,
    //     guestCount,
    //     eventType,
    //     venueLocation,
    //     budget,
    //     message,
    //     storefrontName,
    //   }
    // });

    return NextResponse.json({ 
      success: true, 
      message: 'Demande de devis envoyée avec succès',
      quoteRequestId: quoteRequest.id 
    });

  } catch (error) {
    console.error('Error processing quote request:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
} 