'use client';

import { useState } from 'react';
import { UserData } from '@/types';

interface UserDataFormProps {
  onSubmit: (data: UserData) => void;
}

export default function UserDataForm({ onSubmit }: UserDataFormProps) {
  const [height, setHeight] = useState<string>('');
  const [errors, setErrors] = useState<{ height?: string }>({});

  const validate = () => {
    const newErrors: { height?: string } = {};

    const heightNum = parseFloat(height);

    if (!height || isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      newErrors.height = 'Ingresa una altura válida (100-250 cm)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        height: parseFloat(height),
      });
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Ingresa tu Altura
      </h2>

      <p className="text-gray-600 text-center mb-6">
        Solo necesitamos tu altura para calibrar las medidas correctamente
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
            Altura (cm)
          </label>
          <input
            type="number"
            id="height"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Ej: 175"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${
              errors.height ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.height && (
            <p className="mt-1 text-sm text-red-600">{errors.height}</p>
          )}
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Siguiente
        </button>
      </form>
    </div>
  );
}
