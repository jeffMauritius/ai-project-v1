import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role, ServiceType } from "@prisma/client";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["USER", "PARTNER", "ADMIN"] as const),
  // Données supplémentaires pour les partenaires
  partnerType: z.string().optional(),
  siret: z.string().optional(),
});

// Mapping des types de partenaires vers ServiceType
const partnerTypeToServiceType: Record<string, ServiceType> = {
  'venue': ServiceType.LIEU,
  'catering': ServiceType.TRAITEUR,
  'photographer': ServiceType.PHOTOGRAPHE,
  'florist': ServiceType.FLORISTE,
  'dj': ServiceType.MUSIQUE,
  'decorator': ServiceType.DECORATION,
  'cake': ServiceType.WEDDING_CAKE,
  'dress': ServiceType.LIEU, // Utiliser LIEU comme fallback
  'suit': ServiceType.LIEU, // Utiliser LIEU comme fallback
  'beauty': ServiceType.LIEU, // Utiliser LIEU comme fallback
  'car': ServiceType.VOITURE,
  'planner': ServiceType.ORGANISATION,
};

export async function POST(req: Request) {
  try {

    const body = await req.json();

    const validatedData = registerSchema.parse(body);

    // Check if user already exists

    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {

      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hash password with argon2

    const hashedPassword = await argon2.hash(validatedData.password);

    // Prepare user data
    const userData: any = {
      email: validatedData.email,
      name: validatedData.name,
      password: hashedPassword,
      role: validatedData.role,
    };

    // Create user

    const user = await prisma.user.create({
      data: userData,
    });

    // Create empty profile for user

    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    // Si c'est un partenaire, créer une vitrine avec les données pré-remplies
    if (validatedData.role === "PARTNER" && validatedData.partnerType) {

      const serviceType = partnerTypeToServiceType[validatedData.partnerType] || ServiceType.LIEU;
      
      await prisma.partnerStorefront.create({
        data: {
          userId: user.id,
          companyName: validatedData.name, // Utiliser le nom comme nom d'entreprise par défaut
          description: "", // Description vide à remplir plus tard
          isActive: false, // Vitrine inactive par défaut
          serviceType: serviceType,
          venueType: serviceType === ServiceType.LIEU ? undefined : undefined,
          billingStreet: "",
          billingCity: "",
          billingPostalCode: "",
          billingCountry: "France",
          siret: validatedData.siret || "",
          vatNumber: "",
          venueAddress: null,
          venueLatitude: 48.8566, // Paris par défaut
          venueLongitude: 2.3522,
          interventionType: "all_france",
          interventionRadius: 50,
        },
      });

    }

    // Ne pas renvoyer le mot de passe
    const { password, ...userWithoutPassword } = user;

    return NextResponse.json(
      { 
        message: "Utilisateur créé avec succès",
        user: userWithoutPassword
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REGISTER] Erreur détaillée:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Erreur lors de la création de l'utilisateur: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}