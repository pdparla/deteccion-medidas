'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { useMeasurementSession } from '@/store/measurement-session';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { detectPose } from '@/lib/pose-detection';
import { segmentPerson } from '@/lib/segmentation';
import { cleanMaskWithKeypoints } from '@/lib/mask-utils';
import { calculateBodyMeasurements } from '@/lib/measurement-calculator';
import { ProcessedCapture } from '@/types/measurement';

type ProcessingStage =
  | 'loading-models'
  | 'detecting-pose'
  | 'segmenting'
  | 'calculating'
  | 'complete'
  | 'error';

export default function ProcessingPage() {
  const router = useRouter();
  const {
    userInfo,
    captures,
    setProcessedCaptures,
    setMeasurements,
    setError,
  } = useMeasurementSession();

  const [stage, setStage] = useState<ProcessingStage>('loading-models');
  const [progress, setProgress] = useState(0);
  const [currentView, setCurrentView] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!userInfo || captures.length !== 4) {
      router.push('/capture');
      return;
    }

    processImages();
  }, []);

  const processImages = async () => {
    try {
      setStage('loading-models');
      setProgress(10);

      // Process each capture
      const processedCaptures: ProcessedCapture[] = [];

      for (let i = 0; i < captures.length; i++) {
        const capture = captures[i];
        setCurrentView(capture.view);

        // Detect pose
        setStage('detecting-pose');
        setProgress(20 + (i / captures.length) * 60);
        const poseResult = await detectPose(capture.dataUrl);

        // Run segmentation
        setStage('segmenting');
        let maskData: Uint8Array | undefined;
        try {
          maskData = await segmentPerson(capture.dataUrl);

          if (maskData) {
            // Apply Skeleton-Guided Cleaning to remove background noise/dogs
            maskData = cleanMaskWithKeypoints(maskData, poseResult.keypoints, poseResult.imageWidth, poseResult.imageHeight);
          }
        } catch (e) {
          console.error("Segmentation failed", e);
        }

        // Generate visualization
        let visualizedDataUrl = capture.dataUrl;
        try {
          visualizedDataUrl = await generateVisualization(capture.dataUrl, poseResult.keypoints, maskData, poseResult.imageWidth, poseResult.imageHeight);
        } catch (e) {
          console.error("Failed to generate visualization", e);
        }

        processedCaptures.push({
          ...capture,
          keypoints: poseResult.keypoints,
          mask: maskData ? {
            data: maskData,
            width: 256,
            height: 256
          } : undefined,
          imageWidth: poseResult.imageWidth,
          imageHeight: poseResult.imageHeight,
          visualizedDataUrl
        });
      }

      setProcessedCaptures(processedCaptures);

      // Calculate measurements
      setStage('calculating');
      setProgress(85);

      if (!userInfo) {
        throw new Error('User info not found');
      }

      const measurements = await calculateBodyMeasurements(
        processedCaptures,
        userInfo.heightCm
      );

      setProgress(100);
      setMeasurements(measurements);
      setStage('complete');

      // Navigate to results
      setTimeout(() => {
        router.push('/results');
      }, 1000);
    } catch (error: any) {
      console.error('Processing error:', error);
      setStage('error');
      setErrorMessage(error.message || 'Error al procesar las imágenes');
      setError(error.message || 'Error al procesar las imágenes');
    }
  };

  const stages = [
    { id: 'loading-models', label: 'Cargando modelos de IA' },
    { id: 'detecting-pose', label: 'Detectando pose' },
    { id: 'segmenting', label: 'Extrayendo silueta' },
    { id: 'calculating', label: 'Calculando medidas' },
    { id: 'complete', label: 'Completado' },
  ];

  const getCurrentStageIndex = () => {
    return stages.findIndex((s) => s.id === stage);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Procesando imágenes
            </h1>
            <p className="text-gray-600">
              Por favor espera mientras analizamos tus fotos
            </p>
          </div>

          {stage === 'error' ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                Error de procesamiento
              </h2>
              <p className="text-red-700 mb-4">{errorMessage}</p>
              <button
                onClick={() => router.push('/capture')}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Volver a intentar
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-8">
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-center mt-2 text-sm text-gray-600">
                  {progress}%
                </div>
              </div>

              {/* Stages */}
              <div className="space-y-4">
                {stages.map((s, index) => {
                  const currentIndex = getCurrentStageIndex();
                  const isComplete = index < currentIndex || stage === 'complete';
                  const isCurrent = index === currentIndex && stage !== 'complete';

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${isCurrent ? 'bg-blue-50 border border-blue-200' :
                        isComplete ? 'bg-green-50 border border-green-200' :
                          'bg-gray-50 border border-gray-200'
                        }`}
                    >
                      <div className="flex-shrink-0">
                        {isComplete ? (
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-5 h-5 text-white" />
                          </div>
                        ) : isCurrent ? (
                          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        ) : (
                          <div className="w-8 h-8 bg-gray-300 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className={`font-medium ${isCurrent ? 'text-blue-900' :
                          isComplete ? 'text-green-900' :
                            'text-gray-500'
                          }`}>
                          {s.label}
                        </div>
                        {isCurrent && currentView && (
                          <div className="text-sm text-gray-600 mt-1">
                            Vista: {currentView}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {stage === 'complete' && (
                <div className="mt-6 text-center">
                  <div className="text-green-600 font-semibold mb-2">
                    ¡Procesamiento completado!
                  </div>
                  <div className="text-sm text-gray-600">
                    Redirigiendo a resultados...
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function generateVisualization(
  imageUrl: string,
  keypoints: any[],
  maskData: Uint8Array | undefined,
  width: number,
  height: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error("Failed to get canvas context");
        resolve(imageUrl);
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw mask overlay
      if (maskData) {
        console.log("Drawing mask overlay, size:", maskData.length);
        // Create temporary canvas for mask (256x256)
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = 256;
        maskCanvas.height = 256;
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const maskImgData = maskCtx.createImageData(256, 256);
          for (let i = 0; i < maskData.length; i++) {
            if (maskData[i] > 0) {
              // Pink overlay
              maskImgData.data[i * 4] = 255;     // R
              maskImgData.data[i * 4 + 1] = 0;   // G
              maskImgData.data[i * 4 + 2] = 255; // B
              maskImgData.data[i * 4 + 3] = 100; // Alpha
            }
          }
          maskCtx.putImageData(maskImgData, 0, 0);

          // Draw scaled mask on main canvas
          ctx.drawImage(maskCanvas, 0, 0, width, height);
        }
      } else {
        console.warn("No mask data available for visualization");
      }

      // Draw Skeleton
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth = 3;
      ctx.fillStyle = '#FF0000';

      // Draw points
      keypoints.forEach(kp => {
        if (kp.score > 0.3) {
          ctx.beginPath();
          ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Connections
      const connections = [
        [5, 7], [7, 9], // Left Arm
        [6, 8], [8, 10], // Right Arm
        [5, 6], // Shoulders
        [5, 11], [6, 12], // Torso
        [11, 12], // Hips
        [11, 13], [13, 15], // Left Leg
        [12, 14], [14, 16] // Right Leg
      ];

      ctx.beginPath();
      connections.forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];
        if (kp1 && kp2 && kp1.score > 0.3 && kp2.score > 0.3) {
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
        }
      });
      ctx.stroke();

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
