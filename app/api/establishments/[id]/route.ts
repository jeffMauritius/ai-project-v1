import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const establishment = await prisma.establishment.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        region: true,
        country: true,
        startingPrice: true,
        currency: true,
        maxCapacity: true,
        rating: true,
        reviewCount: true,
        images: true // Utiliser le champ images qui contient les URLs Vercel Blob
      },
    });

    if (!establishment) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      );
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const establishmentData = {
      id: establishment.id,
      name: establishment.name,
      location: `${establishment.city}, ${establishment.region}, ${establishment.country}`,
      rating: establishment.rating || 0,
      numberOfReviews: establishment.reviewCount || 0,
      description: establishment.description || "",
      priceRange: `${establishment.startingPrice || 0} ${establishment.currency || "€"}`,
      capacity: `${establishment.maxCapacity || 0} personnes`,
      // Utiliser directement les URLs 960p de la base de données
      images: establishment.images || []
    };

    return NextResponse.json(establishmentData);
  } catch (error) {
    console.error("Erreur détaillée:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
} 