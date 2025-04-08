import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
          Images: {
            orderBy: {
              order: "asc"
            },
            select: {
              url: true
            }
          }
        },
      }),
      prisma.establishment.count(),
    ]);

    // Transformer les données pour correspondre au format attendu par le frontend
    const transformedEstablishments = establishments.map((e) => ({
      id: e.id,
      name: e.name,
      location: `${e.city}, ${e.region}, ${e.country}`,
      rating: e.rating || 0,
      numberOfReviews: e.reviewCount || 0,
      description: e.description || "",
      priceRange: `${e.startingPrice || 0} ${e.currency || "€"}`,
      capacity: `${e.maxCapacity || 0} personnes`,
      imageUrl: e.Images[0]?.url || "/placeholder-venue.jpg",
      images: e.Images.map(img => img.url),
    }));

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