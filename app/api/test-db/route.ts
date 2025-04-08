import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test de connexion basique
    console.log("URL de la base de données:", process.env.DATABASE_URL);
    
    // Liste toutes les collections
    const collections = await prisma.$runCommandRaw({
      listCollections: 1
    });
    console.log("Collections disponibles:", collections);

    // Essaie de récupérer directement depuis la collection
    const rawEstablishments = await prisma.$runCommandRaw({
      find: "Establishment",
      limit: 1
    });
    console.log("Données brutes de la collection:", rawEstablishments);

    // Essaie de récupérer les établissements via Prisma
    const establishments = await prisma.establishment.findMany();
    console.log("Requête establishments effectuée");
    console.log("Nombre d'établissements:", establishments.length);
    console.log("Premier établissement:", establishments[0]);

    return NextResponse.json({
      success: true,
      databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@'),
      collections,
      rawEstablishments,
      establishmentsCount: establishments.length,
      firstEstablishment: establishments[0]
    });
  } catch (error) {
    console.error("Erreur détaillée:", error);
    return NextResponse.json(
      { 
        success: false,
        error: String(error),
        details: error instanceof Error ? error.stack : undefined,
        databaseUrl: process.env.DATABASE_URL?.replace(/:[^:]+@/, ':****@')
      },
      { status: 500 }
    );
  }
}