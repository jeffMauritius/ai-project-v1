import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rate limiting simple en mémoire (pour production, utiliser Redis)
const resetAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 3;
const WINDOW_MS = 60 * 60 * 1000; // 1 heure

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format d\'email invalide.' }, { status: 400 });
    }

    // Rate limiting par email
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();
    const attempts = resetAttempts.get(normalizedEmail);

    if (attempts) {
      if (now - attempts.lastAttempt < WINDOW_MS) {
        if (attempts.count >= MAX_ATTEMPTS) {
          // Log la tentative pour monitoring de sécurité
          console.warn('[SECURITY] Rate limit exceeded for password reset:', { email: normalizedEmail });
          // Retourner le même message pour ne pas révéler si l'email existe
          return NextResponse.json({
            message: 'Si ce compte existe, un email de réinitialisation sera envoyé.'
          }, { status: 200 });
        }
        attempts.count++;
      } else {
        attempts.count = 1;
        attempts.lastAttempt = now;
      }
    } else {
      resetAttempts.set(normalizedEmail, { count: 1, lastAttempt: now });
    }

    // Chercher l'utilisateur (mais ne pas révéler s'il existe)
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      // TODO: Envoyer l'email de réinitialisation ici
      // await sendPasswordResetEmail(user.email, resetToken);
      console.log('[AUTH] Password reset requested for existing user:', normalizedEmail);
    } else {
      // Log pour monitoring mais ne pas révéler à l'utilisateur
      console.log('[AUTH] Password reset requested for non-existent user:', normalizedEmail);
    }

    // Toujours retourner le même message (prévention énumération d'emails)
    return NextResponse.json({
      message: 'Si ce compte existe, un email de réinitialisation sera envoyé.'
    }, { status: 200 });
  } catch (error) {
    console.error('[AUTH] Error in forgot-password:', error);
    return NextResponse.json({
      message: 'Si ce compte existe, un email de réinitialisation sera envoyé.'
    }, { status: 200 });
  }
} 