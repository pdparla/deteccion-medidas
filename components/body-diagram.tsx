'use client';

import React from 'react';
import { BodyMeasurements } from '@/types/measurement';
import { formatMeasurement } from '@/lib/utils';

interface BodyDiagramProps {
  measurements: BodyMeasurements;
  className?: string;
}

const MEASUREMENT_LABELS = {
  neck: 'Cuello',
  shoulders: 'Hombros',
  chest: 'Pecho',
  waist: 'Cintura',
  hips: 'Cadera',
  biceps: 'Bíceps',
  thighs: 'Muslos',
  calves: 'Gemelos',
};

export function BodyDiagram({ measurements, className }: BodyDiagramProps) {
  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(measurements).map(([key, value]) => (
          <div
            key={key}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors"
          >
            <div className="text-sm text-gray-600 mb-1">
              {MEASUREMENT_LABELS[key as keyof typeof MEASUREMENT_LABELS]}
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatMeasurement(value)}
              <span className="text-sm font-normal text-gray-600 ml-1">cm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Nota:</strong> Estas medidas son estimaciones basadas en análisis de imagen.
          La precisión puede variar ±3-5cm. Para mediciones precisas, utiliza una cinta métrica.
        </p>
      </div>
    </div>
  );
}
