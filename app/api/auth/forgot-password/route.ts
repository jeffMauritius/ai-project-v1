import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return NextResponse.json({ exists: false, message: 'Email non trouvé.' }, { status: 200 });
  }

  // TODO: Send reset email here
  return NextResponse.json({ exists: true, message: 'Un email de réinitialisation a été envoyé.' }, { status: 200 });
} 