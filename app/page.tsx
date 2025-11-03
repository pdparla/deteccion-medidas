'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  // Redirigir a /measurement si ya está autenticado
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/measurement');
    }
  }, [status, router]);

  // Mostrar loading mientras verifica autenticación
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </main>
    );
  }

  // No mostrar nada si está autenticado (se redirigirá)
  if (status === 'authenticated') {
    return null;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Medidas Corporales
        </h1>

        <p className="text-xl text-gray-700 mb-8">
          Obtén tus medidas corporales de forma precisa mediante el análisis de 4 fotografías
        </p>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800">
              ¿Cómo funciona?
            </h2>

            <div className="grid md:grid-cols-3 gap-4 text-left">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">1</div>
                <h3 className="font-semibold text-gray-800 mb-1">Ingresa tu altura</h3>
                <p className="text-sm text-gray-600">Solo necesitamos tu altura para calibrar</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">2</div>
                <h3 className="font-semibold text-gray-800 mb-1">Sube fotos</h3>
                <p className="text-sm text-gray-600">4 fotos: frente, espalda y laterales</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <h3 className="font-semibold text-gray-800 mb-1">Resultados</h3>
                <p className="text-sm text-gray-600">Obtén 8 medidas corporales</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2 flex items-center">
              <span className="text-xl mr-2">⚠️</span>
              IMPORTANTE - Requisitos de las fotos:
            </h3>
            <ul className="text-sm text-gray-800 space-y-2 text-left list-disc list-inside font-medium">
              <li><strong>Ropa interior únicamente</strong> (ropa ajustada mínima para mediciones precisas)</li>
              <li>Distancia: 2-3 metros de la cámara</li>
              <li>Brazos ligeramente separados del cuerpo</li>
              <li>Fondo liso y buena iluminación</li>
              <li>Postura erguida, de pie completamente visible</li>
            </ul>
          </div>

          <Link
            href="/auth/signin"
            className="inline-block bg-primary hover:bg-blue-600 text-white font-semibold text-lg px-8 py-4 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Comenzar
          </Link>

          <p className="text-xs text-gray-500 mt-4">
            Todas las fotos se procesan localmente en tu navegador. No se envían a ningún servidor.
          </p>
        </div>
      </div>
    </main>
  );
}
