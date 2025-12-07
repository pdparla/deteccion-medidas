'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMeasurementSession } from '@/store/measurement-session';
import { Camera, Ruler, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { setUserInfo } = useMeasurementSession();
  const [height, setHeight] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const heightNum = parseFloat(height);
    if (isNaN(heightNum) || heightNum < 100 || heightNum > 250) {
      setError('Por favor ingresa una altura válida (100-250 cm)');
      return;
    }

    setUserInfo({ heightCm: heightNum });
    router.push('/capture');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Ruler className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Medición Corporal con IA
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Obtén tus medidas corporales usando inteligencia artificial directamente en tu navegador
          </p>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <CardTitle className="text-lg">Ingresa tu altura</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Proporciona tu altura en centímetros para calibrar las mediciones
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <Camera className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-lg">Captura 4 fotos</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Toma fotos desde 4 ángulos: frente, derecha, espalda e izquierda
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-lg">Obtén medidas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Visualiza 8 medidas corporales: cuello, hombros, pecho, cintura, cadera, bíceps, muslos y gemelos
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Input form */}
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Comienza tu medición</CardTitle>
            <CardDescription>
              Ingresa tu altura para comenzar el proceso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
                  Altura (cm)
                </label>
                <Input
                  id="height"
                  type="number"
                  placeholder="170"
                  value={height}
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setError('');
                  }}
                  min="100"
                  max="250"
                  step="0.1"
                  required
                />
                {error && (
                  <p className="text-sm text-red-600 mt-1">{error}</p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full">
                Comenzar captura
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Privacy notice */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 max-w-2xl mx-auto">
            <strong>Privacidad garantizada:</strong> Todo el procesamiento ocurre localmente en tu navegador.
            Tus fotos nunca se envían a ningún servidor y se eliminan al cerrar la página.
          </p>
        </div>
      </div>
    </div>
  );
}
