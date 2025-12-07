'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMeasurementSession } from '@/store/measurement-session';
import { BodyDiagram } from '@/components/body-diagram';
import { Download, RotateCcw } from 'lucide-react';

export default function ResultsPage() {
  const router = useRouter();
  const { userInfo, measurements, captures, reset } = useMeasurementSession();

  useEffect(() => {
    if (!userInfo || !measurements) {
      router.push('/');
    }
  }, [userInfo, measurements, router]);

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres reiniciar? Se perderán todos los datos.')) {
      reset();
      router.push('/');
    }
  };

  const handleExport = () => {
    if (!measurements || !userInfo) return;

    const data = {
      date: new Date().toISOString(),
      userInfo,
      measurements,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medidas-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!measurements || !userInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Tus medidas corporales
          </h1>
          <p className="text-gray-600">
            Altura de referencia: {userInfo.heightCm} cm
          </p>
        </div>

        {/* Measurements */}
        <BodyDiagram measurements={measurements} className="mb-8" />

        {/* Captured images preview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fotos capturadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {captures.map((capture) => (
                <div key={capture.view} className="space-y-2">
                  <img
                    src={capture.dataUrl}
                    alt={capture.view}
                    className="w-full rounded-lg border border-gray-200"
                  />
                  <p className="text-sm text-center text-gray-600 capitalize">
                    {capture.view}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleExport} variant="outline" size="lg">
            <Download className="mr-2 w-5 h-5" />
            Exportar JSON
          </Button>
          <Button onClick={handleReset} size="lg">
            <RotateCcw className="mr-2 w-5 h-5" />
            Nueva medición
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 max-w-2xl mx-auto">
            Las medidas mostradas son estimaciones basadas en análisis de imagen por IA.
            Para mediciones médicas o profesionales, consulta con un especialista.
          </p>
        </div>
      </div>
    </div>
  );
}
