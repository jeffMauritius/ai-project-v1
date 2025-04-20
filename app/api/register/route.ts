import { NextResponse } from "next/server";
import * as argon2 from "argon2";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Role } from "@prisma/client";

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["USER", "PARTNER", "ADMIN"] as const),
});

export async function POST(req: Request) {
  try {
    console.log("[REGISTER] Début de la requête d'inscription");
    const body = await req.json();
    console.log("[REGISTER] Corps de la requête reçu:", { ...body, password: '[REDACTED]' });
    
    const validatedData = registerSchema.parse(body);
    console.log("[REGISTER] Données validées");

    // Check if user already exists
    console.log("[REGISTER] Vérification de l'existence de l'utilisateur");
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      console.log("[REGISTER] Utilisateur déjà existant");
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      );
    }

    // Hash password with argon2
    console.log("[REGISTER] Hashage du mot de passe");
    const hashedPassword = await argon2.hash(validatedData.password);

    // Create user
    console.log("[REGISTER] Création de l'utilisateur");
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
      },
    });
    console.log("[REGISTER] Utilisateur créé avec succès");

    // Create empty profile for user
    console.log("[REGISTER] Création du profil");
    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });
    console.log("[REGISTER] Profil créé avec succès");

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