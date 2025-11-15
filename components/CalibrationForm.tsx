'use client';

import { useState } from 'react';
import { BodyMeasurements } from '@/types';

interface CalibrationFormProps {
  predictedMeasurements: BodyMeasurements;
  onSubmit: (realMeasurements: BodyMeasurements) => void;
  onSkip: () => void;
}

export default function CalibrationForm({ predictedMeasurements, onSubmit, onSkip }: CalibrationFormProps) {
  const [realMeasurements, setRealMeasurements] = useState<BodyMeasurements>({ ...predictedMeasurements });
  const [inputValues, setInputValues] = useState<Record<keyof BodyMeasurements, string>>(
    Object.fromEntries(
      Object.entries(predictedMeasurements).map(([key, value]) => [key, Math.round(value).toString()])
    ) as Record<keyof BodyMeasurements, string>
  );

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(realMeasurements);
  };

  const handleChange = (key: keyof BodyMeasurements, value: string) => {
    // Allow empty string or valid number input
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setInputValues({ ...inputValues, [key]: value });

      // Update realMeasurements only if valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        setRealMeasurements({ ...realMeasurements, [key]: numValue });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
        Calibración Personalizada
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Para mejorar la precisión, ingresa tus medidas reales. Usa una cinta métrica para medir cada parte de tu cuerpo.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {measurementLabels.map(({ key, label, icon }) => (
            <div
              key={key}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200"
            >
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="font-semibold text-gray-800">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">Medida estimada</label>
                  <div className="text-lg font-bold text-gray-500">
                    {predictedMeasurements[key].toFixed(1)} cm
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-600 block mb-1">Tu medida real</label>
                  <div className="flex items-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValues[key]}
                      onChange={(e) => handleChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0"
                    />
                    <span className="ml-2 text-gray-600">cm</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Consejo:</strong> Mide cada parte con una cinta métrica flexible. Para medidas circulares (cuello, pecho, cintura, cadera, muslo, gemelo, bíceps), rodea la parte más ancha. Para hombros, mide de hombro a hombro en línea recta.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onSkip}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
          >
            Omitir Calibración
          </button>
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-blue-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200"
          >
            Guardar y Calibrar
          </button>
        </div>
      </form>
    </div>
  );
}
