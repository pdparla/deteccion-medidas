'use client';

import { BodyMeasurements } from '@/types';
import { useState } from 'react';

interface MeasurementResultsProps {
  measurements: BodyMeasurements;
  onRestart: () => void;
}

export default function MeasurementResults({ measurements, onRestart }: MeasurementResultsProps) {
  const [copied, setCopied] = useState(false);

  const measurementLabels: { key: keyof BodyMeasurements; label: string; icon: string }[] = [
    { key: 'neck', label: 'Cuello', icon: '👔' },
    { key: 'shoulders', label: 'Hombros', icon: '💪' },
    { key: 'chest', label: 'Pecho', icon: '🫁' },
    { key: 'waist', label: 'Cintura', icon: '⚖️' },
    { key: 'hips', label: 'Cadera', icon: '🔄' },
    { key: 'thigh', label: 'Muslo', icon: '🦵' },
    { key: 'calf', label: 'Gemelo', icon: '🦿' },
    { key: 'bicep', label: 'Bíceps', icon: '💪' },
  ];

  const handleCopy = async () => {
    const formattedText = measurementLabels
      .map(({ key, label }) => `${label}: ${measurements[key].toFixed(1)}cm`)
      .join('\n');

    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Tus Medidas Corporales
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Resultados obtenidos mediante análisis
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {measurementLabels.map(({ key, label, icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{icon}</span>
              <span className="font-semibold text-gray-800">{label}</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">
                {measurements[key].toFixed(1)}
              </span>
              <span className="text-gray-600 ml-1">cm</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Nota:</strong> Estas medidas son aproximadas y se basan en análisis de imagen.
          Para medidas precisas, se recomienda medición manual con cinta métrica.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleCopy}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Copiado</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>Copiar Medidas</span>
            </>
          )}
        </button>
        <button
          onClick={onRestart}
          className="flex-1 bg-primary hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
        >
          Realizar Nueva Medición
        </button>
      </div>
    </div>
  );
}
