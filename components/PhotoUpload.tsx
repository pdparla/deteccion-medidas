'use client';

import { Photos } from '@/types';
import PhotoSlot from './PhotoSlot';

interface PhotoUploadProps {
  photos: Photos;
  onPhotosChange: (photos: Photos) => void;
  onAnalyze: () => void;
}

export default function PhotoUpload({ photos, onPhotosChange, onAnalyze }: PhotoUploadProps) {
  const handleFileSelect = (type: keyof Photos, file: File) => {
    onPhotosChange({
      ...photos,
      [type]: file,
    });
  };

  const allPhotosUploaded = photos.front && photos.back && photos.left && photos.right;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Sube tus Fotografías
      </h2>

      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-red-800 mb-2 flex items-center">
          <span className="text-xl mr-2">⚠️</span>
          REQUISITOS OBLIGATORIOS:
        </h3>
        <ul className="text-sm text-gray-800 space-y-2 list-disc list-inside font-medium">
          <li><strong className="text-red-700">Ropa interior únicamente</strong> - Imprescindible para mediciones precisas</li>
          <li>Distancia: 2-3 metros de la cámara</li>
          <li>Brazos ligeramente separados del cuerpo</li>
          <li>Fondo liso con buena iluminación</li>
          <li>De pie, postura erguida, completamente visible</li>
        </ul>
        <p className="text-xs text-gray-600 mt-3 italic">
          ⚠️ Las fotos con ropa holgada producirán medidas incorrectas
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <PhotoSlot
          type="front"
          label="Foto de Frente"
          file={photos.front}
          onFileSelect={(file) => handleFileSelect('front', file)}
        />
        <PhotoSlot
          type="back"
          label="Foto de Espalda"
          file={photos.back}
          onFileSelect={(file) => handleFileSelect('back', file)}
        />
        <PhotoSlot
          type="left"
          label="Foto Lateral Izquierdo"
          file={photos.left}
          onFileSelect={(file) => handleFileSelect('left', file)}
        />
        <PhotoSlot
          type="right"
          label="Foto Lateral Derecho"
          file={photos.right}
          onFileSelect={(file) => handleFileSelect('right', file)}
        />
      </div>

      <button
        onClick={onAnalyze}
        disabled={!allPhotosUploaded}
        className={`w-full font-semibold py-4 px-6 rounded-lg transition-colors duration-200 ${
          allPhotosUploaded
            ? 'bg-success hover:bg-green-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {allPhotosUploaded ? 'Analizar Medidas' : 'Sube las 4 fotos para continuar'}
      </button>
    </div>
  );
}
