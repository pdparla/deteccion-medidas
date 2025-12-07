'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useMeasurementSession } from '@/store/measurement-session';
import { ViewType } from '@/types/measurement';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { PhotoUpload } from '@/components/photo-upload';

export default function CapturePage() {
  const router = useRouter();
  const { userInfo, addCapture } = useMeasurementSession();

  const [photos, setPhotos] = useState<Record<ViewType, File | null>>({
    front: null,
    right: null,
    back: null,
    left: null,
  });

  const [photoUrls, setPhotoUrls] = useState<Record<ViewType, string | null>>({
    front: null,
    right: null,
    back: null,
    left: null,
  });

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userInfo) {
      router.push('/');
    }
  }, [userInfo, router]);

  const handlePhotoChange = useCallback((view: ViewType, file: File) => {
    setPhotos((prev) => ({ ...prev, [view]: file }));

    // Create data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoUrls((prev) => ({ ...prev, [view]: e.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePhotoRemove = useCallback((view: ViewType) => {
    setPhotos((prev) => ({ ...prev, [view]: null }));
    setPhotoUrls((prev) => ({ ...prev, [view]: null }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    // Check all photos are uploaded
    const allPhotosUploaded = Object.values(photos).every((photo) => photo !== null);
    if (!allPhotosUploaded) {
      alert('Por favor sube las 4 fotos antes de analizar');
      return;
    }

    setIsProcessing(true);

    try {
      // Add all captures to the store
      for (const view of ['front', 'right', 'back', 'left'] as ViewType[]) {
        if (photoUrls[view]) {
          addCapture({
            view,
            dataUrl: photoUrls[view]!,
            timestamp: Date.now(),
          });
        }
      }

      // Navigate to processing
      router.push('/processing');
    } catch (error: any) {
      console.error('Error processing photos:', error);
      alert(error.message || 'Error al procesar las imágenes');
    } finally {
      setIsProcessing(false);
    }
  }, [photos, photoUrls, addCapture, router]);

  const allPhotosUploaded = Object.values(photos).every((photo) => photo !== null);
  const uploadedCount = Object.values(photos).filter((photo) => photo !== null).length;

  if (!userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => router.push('/')} variant="outline" size="sm">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Volver
            </Button>
            <div className="text-sm text-gray-600">
              {uploadedCount} de 4 fotos subidas
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sube tus fotos
          </h1>
          <p className="text-gray-600">
            Sube 4 fotos (frontal, lateral derecha, posterior, lateral izquierda) para obtener tus medidas corporales
          </p>
        </div>

        {/* Instructions Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="font-semibold text-lg mb-3">Instrucciones importantes</h2>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Usa ropa ajustada que permita ver la silueta de tu cuerpo</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Tómate las fotos a 2-3 metros de distancia</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Mantén los brazos ligeramente separados del cuerpo</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Asegúrate de que todo tu cuerpo sea visible en cada foto</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span>Usa un fondo liso y con buena iluminación</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <PhotoUpload
          photos={photos}
          photoUrls={photoUrls}
          onPhotoChange={handlePhotoChange}
          onPhotoRemove={handlePhotoRemove}
        />

        {/* Analyze Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={handleAnalyze}
            disabled={!allPhotosUploaded || isProcessing}
            size="lg"
            className="px-12"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Analizar fotos
                <ArrowRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
