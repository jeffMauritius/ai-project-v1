import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const establishment = await prisma.establishment.findUnique({
      where: { id: params.id },
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
        Images: {
          orderBy: {
            order: "asc"
          },
          select: {
            url: true
          }
        }
      },
    });

    if (!establishment) {
      return NextResponse.json(
        { error: "Établissement non trouvé" },
        { status: 404 }
      );
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedEstablishment = {
      id: establishment.id,
      name: establishment.name,
      location: `${establishment.city}, ${establishment.region}, ${establishment.country}`,
      rating: establishment.rating || 0,
      numberOfReviews: establishment.reviewCount || 0,
      description: establishment.description || "",
      priceRange: `${establishment.startingPrice || 0} ${establishment.currency || "€"}`,
      capacity: `${establishment.maxCapacity || 0} personnes`,
      imageUrl: establishment.Images[0]?.url || "/placeholder-venue.jpg",
      images: establishment.Images.map(img => img.url),
    };

    return NextResponse.json(transformedEstablishment);
  } catch (error) {
    console.error("Erreur détaillée:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
} 