import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { transformEstablishmentImages } from "@/lib/image-url-transformer";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "9"));
    const skip = Math.max(0, (page - 1) * limit);

    console.log("Fetching establishments with:", { page, limit, skip });

    const [establishments, total] = await Promise.all([
      prisma.establishment.findMany({
        skip,
        take: limit,
        orderBy: {
          name: "asc",
        },
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
          images: true, // Utiliser le champ images qui contient les URLs Vercel Blob
          storefronts: {
            select: {
              id: true
            },
            take: 1
          }
        },
      }),
      prisma.establishment.count(),
    ]);

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedEstablishments = establishments.map((e) => {
      const establishment = {
        id: e.storefronts[0]?.id || e.id, // Utiliser l'ID du storefront si disponible, sinon l'ID de l'establishment
        name: e.name,
        location: `${e.city}, ${e.region}, ${e.country}`,
        rating: e.rating || 0,
        numberOfReviews: e.reviewCount || 0,
        description: e.description || "",
        priceRange: `${e.startingPrice || 0} ${e.currency || "€"}`,
        capacity: `${e.maxCapacity || 0} personnes`,
        // Utiliser le tableau images qui contient déjà les URLs Vercel Blob
        images: e.images || [],
        // Ajouter l'ID original pour la transformation
        originalId: e.id
      };
      
      // Appliquer la transformation des URLs d'images
      return transformEstablishmentImages(establishment);
    });

    console.log("Found establishments:", transformedEstablishments);
    console.log("Total count:", total);

    return NextResponse.json({ establishments: transformedEstablishments, total });
  } catch (error) {
    console.error("Erreur détaillée:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}