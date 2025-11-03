import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user's calibration coefficients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const calibration = await prisma.calibration.findUnique({
      where: { userId: session.user.id },
    });

    if (!calibration) {
      return NextResponse.json(
        { error: 'Calibración no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(calibration);
  } catch (error) {
    console.error('Error getting calibration:', error);
    return NextResponse.json(
      { error: 'Error al obtener calibración' },
      { status: 500 }
    );
  }
}

// POST - Update user's calibration coefficients based on real measurements
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const {
      predictedMeasurements,
      realMeasurements,
    } = await request.json();

    if (!predictedMeasurements || !realMeasurements) {
      return NextResponse.json(
        { error: 'Medidas predichas y reales son requeridas' },
        { status: 400 }
      );
    }

    // Calculate new coefficients based on the ratio of real to predicted
    const calculateCoeff = (real: number, predicted: number, currentCoeff: number) => {
      if (predicted === 0) return currentCoeff;
      const ratio = real / predicted;
      return currentCoeff * ratio;
    };

    const currentCalibration = await prisma.calibration.findUnique({
      where: { userId: session.user.id },
    });

    if (!currentCalibration) {
      return NextResponse.json(
        { error: 'Calibración no encontrada' },
        { status: 404 }
      );
    }

    // Calculate new coefficients
    const newCoeffs = {
      neckCoeff: calculateCoeff(
        realMeasurements.neck,
        predictedMeasurements.neck,
        currentCalibration.neckCoeff
      ),
      shouldersCoeff: calculateCoeff(
        realMeasurements.shoulders,
        predictedMeasurements.shoulders,
        currentCalibration.shouldersCoeff
      ),
      chestCoeff: calculateCoeff(
        realMeasurements.chest,
        predictedMeasurements.chest,
        currentCalibration.chestCoeff
      ),
      waistCoeff: calculateCoeff(
        realMeasurements.waist,
        predictedMeasurements.waist,
        currentCalibration.waistCoeff
      ),
      hipsCoeff: calculateCoeff(
        realMeasurements.hips,
        predictedMeasurements.hips,
        currentCalibration.hipsCoeff
      ),
      thighCoeff: calculateCoeff(
        realMeasurements.thigh,
        predictedMeasurements.thigh,
        currentCalibration.thighCoeff
      ),
      calfCoeff: calculateCoeff(
        realMeasurements.calf,
        predictedMeasurements.calf,
        currentCalibration.calfCoeff
      ),
      bicepCoeff: calculateCoeff(
        realMeasurements.bicep,
        predictedMeasurements.bicep,
        currentCalibration.bicepCoeff
      ),
    };

    // Update calibration
    const updatedCalibration = await prisma.calibration.update({
      where: { userId: session.user.id },
      data: {
        ...newCoeffs,
        isCalibrated: true,
      },
    });

    return NextResponse.json(updatedCalibration);
  } catch (error) {
    console.error('Error updating calibration:', error);
    return NextResponse.json(
      { error: 'Error al actualizar calibración' },
      { status: 500 }
    );
  }
}
