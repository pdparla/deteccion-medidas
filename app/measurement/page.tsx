'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserData, Photos, BodyMeasurements } from '@/types';
import StepIndicator from '@/components/StepIndicator';
import UserDataForm from '@/components/UserDataForm';
import PhotoUpload from '@/components/PhotoUpload';
import MeasurementResults from '@/components/MeasurementResults';
import CalibrationForm from '@/components/CalibrationForm';
import { detectPose, initializePose } from '@/lib/poseDetection';
import { calculateBodyMeasurements, CalibrationCoefficients } from '@/lib/measurements';

export default function MeasurementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
  const [userCoefficients, setUserCoefficients] = useState<CalibrationCoefficients | null>(null);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Precargar el modelo, obtener coeficientes y altura del usuario
  useEffect(() => {
    const loadModelAndCoefficients = async () => {
      try {
        // Cargar modelo
        await initializePose();

        // Obtener coeficientes y altura del usuario si está autenticado
        if (session?.user?.id) {
          // Obtener coeficientes
          const calibrationResponse = await fetch('/api/calibration');
          if (calibrationResponse.ok) {
            const calibration = await calibrationResponse.json();
            setUserCoefficients({
              neckCoeff: calibration.neckCoeff,
              shouldersCoeff: calibration.shouldersCoeff,
              chestCoeff: calibration.chestCoeff,
              waistCoeff: calibration.waistCoeff,
              hipsCoeff: calibration.hipsCoeff,
              thighCoeff: calibration.thighCoeff,
              calfCoeff: calibration.calfCoeff,
              bicepCoeff: calibration.bicepCoeff,
            });
            setIsCalibrated(calibration.isCalibrated);
          }

          // Obtener altura guardada
          const heightResponse = await fetch('/api/user/height');
          if (heightResponse.ok) {
            const { height } = await heightResponse.json();
            if (height) {
              setUserData({ height });
              setCurrentStep(2); // Saltar al paso 2 si ya tiene altura
            }
          }
        }
      } catch (err) {
        console.error('Error loading model or coefficients:', err);
        setError('Error al cargar el modelo de IA. Por favor, recarga la página.');
      } finally {
        setIsLoadingModel(false);
      }
    };

    if (status === 'authenticated') {
      loadModelAndCoefficients();
    }
  }, [session, status]);

  const handleUserDataSubmit = async (data: UserData) => {
    setUserData(data);

    // Guardar altura en la base de datos
    try {
      await fetch('/api/user/height', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ height: data.height }),
      });
    } catch (err) {
      console.error('Error saving height:', err);
      // No mostramos error al usuario, solo logueamos
    }

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

      // Calcular medidas usando coeficientes del usuario (o por defecto)
      const calculatedMeasurements = await calculateBodyMeasurements(
        {
          front: frontPose,
          back: backPose,
          left: leftPose,
          right: rightPose,
        },
        userData.height,
        userCoefficients || undefined
      );

      setMeasurements(calculatedMeasurements);

      // Si el usuario no está calibrado, mostrar formulario de calibración
      if (!isCalibrated) {
        setShowCalibration(true);
        setCurrentStep(3);
      } else {
        // Si ya está calibrado, guardar medición y mostrar resultados
        await saveMeasurement(calculatedMeasurements, userData.height);
        setCurrentStep(4);
      }
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

  const handleCalibrationSubmit = async (realMeasurements: BodyMeasurements) => {
    if (!measurements) return;

    try {
      // Enviar calibración al servidor
      const response = await fetch('/api/calibration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictedMeasurements: measurements,
          realMeasurements,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar calibración');
      }

      const updatedCalibration = await response.json();
      setUserCoefficients({
        neckCoeff: updatedCalibration.neckCoeff,
        shouldersCoeff: updatedCalibration.shouldersCoeff,
        chestCoeff: updatedCalibration.chestCoeff,
        waistCoeff: updatedCalibration.waistCoeff,
        hipsCoeff: updatedCalibration.hipsCoeff,
        thighCoeff: updatedCalibration.thighCoeff,
        calfCoeff: updatedCalibration.calfCoeff,
        bicepCoeff: updatedCalibration.bicepCoeff,
      });
      setIsCalibrated(true);

      // Guardar medición con las medidas reales
      if (userData) {
        await saveMeasurement(realMeasurements, userData.height);
      }

      setShowCalibration(false);
      setCurrentStep(4);
    } catch (err) {
      console.error('Error saving calibration:', err);
      setError('Error al guardar la calibración. Por favor, intenta de nuevo.');
    }
  };

  const handleSkipCalibration = async () => {
    if (!measurements || !userData) return;

    // Guardar medición con las medidas predichas
    await saveMeasurement(measurements, userData.height);
    setShowCalibration(false);
    setCurrentStep(4);
  };

  const saveMeasurement = async (measurementsToSave: BodyMeasurements, height: number) => {
    try {
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height,
          ...measurementsToSave,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al guardar medición');
      }
    } catch (err) {
      console.error('Error saving measurement:', err);
      // No mostrar error al usuario, solo loguear
    }
  };

  const handleRestart = () => {
    // Si el usuario ya tiene altura, ir directo al paso 2
    // Si no, ir al paso 1 para ingresarla
    if (userData?.height) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
      setUserData(null);
    }

    setPhotos({
      front: null,
      back: null,
      left: null,
      right: null,
    });
    setMeasurements(null);
    setError(null);
    setShowCalibration(false);
  };

  const handleRecalibrate = () => {
    // Volver al formulario de calibración con las medidas actuales
    setShowCalibration(true);
    setCurrentStep(3);
  };

  // Mostrar loading mientras verifica autenticación
  if (status === 'loading' || isLoadingModel) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-primary mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            {status === 'loading' ? 'Verificando sesión...' : 'Preparando el Sistema'}
          </h2>
          <p className="text-gray-600 mb-2">
            {status === 'loading'
              ? 'Un momento por favor...'
              : 'Cargando el modelo de detección de pose...'}
          </p>
          {status !== 'loading' && (
            <p className="text-sm text-gray-500">
              Esto solo ocurre la primera vez y puede tardar unos segundos
            </p>
          )}
        </div>
      </main>
    );
  }

  // No mostrar nada si no está autenticado (se redirigirá)
  if (status === 'unauthenticated') {
    return null;
  }

  const totalSteps = isCalibrated ? 3 : 4;

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Análisis de Medidas Corporales
          </h1>
          {session?.user?.email && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Sesión iniciada como:</p>
              <p className="text-sm font-semibold text-gray-800">{session.user.email}</p>
            </div>
          )}
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />

        {currentStep === 1 && <UserDataForm onSubmit={handleUserDataSubmit} />}

        {currentStep === 2 && (
          <>
            {userData && (
              <div className="max-w-4xl mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Altura guardada:</p>
                  <p className="text-lg font-semibold text-gray-800">{userData.height} cm</p>
                </div>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-primary hover:text-blue-700 font-semibold text-sm"
                >
                  Cambiar altura
                </button>
              </div>
            )}

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

        {currentStep === 3 && showCalibration && measurements && (
          <CalibrationForm
            predictedMeasurements={measurements}
            onSubmit={handleCalibrationSubmit}
            onSkip={handleSkipCalibration}
          />
        )}

        {currentStep === 4 && measurements && (
          <MeasurementResults
            measurements={measurements}
            onRestart={handleRestart}
            onRecalibrate={handleRecalibrate}
          />
        )}
      </div>
    </main>
  );
}
