import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's measurement history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const measurements = await prisma.measurement.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(measurements);
  } catch (error) {
    console.error('Error getting measurements:', error);
    return NextResponse.json(
      { error: 'Error al obtener mediciones' },
      { status: 500 }
    );
  }
}

// POST - Save a new measurement
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const {
      height,
      neck,
      shoulders,
      chest,
      waist,
      hips,
      thigh,
      calf,
      bicep,
    } = await request.json();

    if (!height || !neck || !shoulders || !chest || !waist || !hips || !thigh || !calf || !bicep) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    const measurement = await prisma.measurement.create({
      data: {
        userId: session.user.id,
        height,
        neck,
        shoulders,
        chest,
        waist,
        hips,
        thigh,
        calf,
        bicep,
      },
    });

    return NextResponse.json(measurement, { status: 201 });
  } catch (error) {
    console.error('Error saving measurement:', error);
    return NextResponse.json(
      { error: 'Error al guardar medición' },
      { status: 500 }
    );
  }
}
