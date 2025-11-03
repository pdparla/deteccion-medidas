import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's height
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { height: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ height: user.height });
  } catch (error) {
    console.error('Error getting height:', error);
    return NextResponse.json({ error: 'Error al obtener altura' }, { status: 500 });
  }
}

// POST - Update user's height
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { height } = await request.json();

    if (!height || typeof height !== 'number' || height < 100 || height > 250) {
      return NextResponse.json(
        { error: 'Altura inválida (debe estar entre 100-250 cm)' },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { height },
      select: { height: true },
    });

    return NextResponse.json({ height: user.height });
  } catch (error) {
    console.error('Error updating height:', error);
    return NextResponse.json({ error: 'Error al actualizar altura' }, { status: 500 });
  }
}
