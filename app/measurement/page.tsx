'use client';

import { useState, useEffect } from 'react';
import { UserData, Photos, BodyMeasurements, PoseLandmarks } from '@/types';
import StepIndicator from '@/components/StepIndicator';
import UserDataForm from '@/components/UserDataForm';
import PhotoUpload from '@/components/PhotoUpload';
import MeasurementResults from '@/components/MeasurementResults';
import { detectPose, initializePose } from '@/lib/poseDetection';
import { calculateBodyMeasurements } from '@/lib/measurements';

export default function MeasurementPage() {
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [photos, setPhotos] = useState<Photos>({
    front: null,
    back: null,
    left: null,
    right: null,
  });
  const [measurements, setMeasurements] = useState<BodyMeasurements | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Precargar el modelo al montar el componente
  useEffect(() => {
    const loadModel = async () => {
      try {
        await initializePose();
      } catch (err) {
        console.error('Error loading model:', err);
        setError('Error al cargar el modelo de IA. Por favor, recarga la página.');
      } finally {
        setIsLoadingModel(false);
      }
    };

    loadModel();
  }, []);

  const handleUserDataSubmit = (data: UserData) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleAnalyze = async () => {
    if (!photos.front || !photos.back || !photos.left || !photos.right || !userData) {
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // Detectar pose en cada foto
      const [frontPose, backPose, leftPose, rightPose] = await Promise.all([
        detectPose(photos.front),
        detectPose(photos.back),
        detectPose(photos.left),
        detectPose(photos.right),
      ]);

      // Verificar que todas las poses fueron detectadas
      if (!frontPose || !backPose || !leftPose || !rightPose) {
        throw new Error('No se pudo detectar la pose en una o más fotografías. Asegúrate de que la persona esté completamente visible y de pie.');
      }

      // Calcular medidas
      const calculatedMeasurements = await calculateBodyMeasurements(
        {
          front: frontPose,
          back: backPose,
          left: leftPose,
          right: rightPose,
        },
        userData.height
      );

      setMeasurements(calculatedMeasurements);
      setCurrentStep(3);
    } catch (err) {
      console.error('Error analyzing photos:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al analizar las fotografías. Por favor, intenta de nuevo con fotos diferentes.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setUserData(null);
    setPhotos({
      front: null,
      back: null,
      left: null,
      right: null,
    });
    setMeasurements(null);
    setError(null);
  };

  // Mostrar pantalla de carga mientras se carga el modelo
  if (isLoadingModel) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            Preparando el Sistema
          </h2>
          <p className="text-gray-600 mb-2">
            Cargando el modelo de detección de pose...
          </p>
          <p className="text-sm text-gray-500">
            Esto solo ocurre la primera vez y puede tardar unos segundos
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Análisis de Medidas Corporales
        </h1>

        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {currentStep === 1 && <UserDataForm onSubmit={handleUserDataSubmit} />}

        {currentStep === 2 && (
          <>
            <PhotoUpload
              photos={photos}
              onPhotosChange={setPhotos}
              onAnalyze={handleAnalyze}
            />

            {error && (
              <div className="mt-6 max-w-4xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 font-semibold">Error:</p>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Analizando fotografías...
                  </h3>
                  <p className="text-gray-600">
                    Esto puede tardar unos momentos. Por favor, espera.
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {currentStep === 3 && measurements && (
          <MeasurementResults measurements={measurements} onRestart={handleRestart} />
        )}
      </div>
    </main>
  );
}
