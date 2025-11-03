# Aplicación Web de Medidas Corporales - Solo Frontend

## Descripción del Proyecto
Aplicación web frontend que permite a los usuarios obtener medidas corporales (gemelo, pierna, cadera, cintura, pecho, hombro, bíceps, cuello) mediante el análisis de 4 fotografías (frente, espalda, lateral izquierdo, lateral derecho).

## Stack Tecnológico
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **ML/Vision**: MediaPipe Pose (procesamiento 100% en el navegador)
- **Hosting**: Vercel (gratuito)
- **Sin base de datos, sin backend, sin persistencia**

## Funcionalidades Principales

### 1. Flujo de Usuario (3 pasos)
**Paso 1: Datos básicos**
- Input de altura (cm)
- Input de peso (kg)
- Validación de datos
- Botón "Siguiente"

**Paso 2: Subida de fotos**
- 4 slots claramente etiquetados:
  - Foto de frente
  - Foto de espalda
  - Foto lateral izquierdo
  - Foto lateral derecho
- Drag & drop o selección de archivos desde dispositivo
- Preview de cada foto subida
- Instrucciones visuales para el usuario (ropa ajustada, distancia 2-3m, brazos separados, fondo liso, buena iluminación)
- Botón "Analizar" habilitado solo cuando las 4 fotos estén cargadas

**Paso 3: Resultados**
- Visualización de las 8 medidas corporales en cm
- Opcional: visualización de landmarks de MediaPipe sobre las fotos
- Botón "Reiniciar" para volver al paso 1

### 2. Procesamiento de Imágenes
- Usar MediaPipe Pose para detectar 33 landmarks en cada foto
- Procesamiento 100% en el navegador (sin servidor)
- Loader/spinner durante el análisis
- Las fotos se procesan pero NO se guardan (solo en memoria durante la sesión)

### 3. Algoritmo de Calibración y Medición
**Calibración:**
- Usar la altura proporcionada por el usuario como referencia
- Calcular la escala píxel/cm basándose en la distancia de nariz a tobillos en la foto frontal

**Medidas a calcular:**
- **Cuello**: circunferencia aproximada
- **Hombros**: ancho entre hombro izquierdo y derecho
- **Pecho**: circunferencia aproximada a nivel de pezones
- **Cintura**: circunferencia aproximada a nivel de cadera superior
- **Cadera**: circunferencia aproximada a nivel de cadera
- **Muslo**: circunferencia aproximada
- **Gemelo**: circunferencia aproximada
- **Bíceps**: circunferencia aproximada del brazo

Usar landmarks específicos de MediaPipe (índices 0-32) para cada medida.

## Requisitos Técnicos

### Estructura del Proyecto
```
src/
├── app/
│   ├── page.tsx                    # Landing page con botón "Comenzar"
│   └── measurement/
│       └── page.tsx                # Flujo principal (3 pasos)
├── components/
│   ├── UserDataForm.tsx            # Formulario altura/peso
│   ├── PhotoUpload.tsx             # Upload de 4 fotos
│   ├── PhotoSlot.tsx               # Slot individual para cada foto
│   ├── MeasurementResults.tsx      # Visualización de resultados
│   └── StepIndicator.tsx           # Indicador de progreso (1/3, 2/3, 3/3)
├── lib/
│   ├── poseDetection.ts            # Setup y uso de MediaPipe
│   ├── calibration.ts              # Cálculo de escala píxel→cm
│   └── measurements.ts             # Algoritmos de medición
└── types/
    └── index.ts                    # Interfaces TypeScript
```

### Configuración de MediaPipe
- Usar CDN: `https://cdn.jsdelivr.net/npm/@mediapipe/pose/`
- modelComplexity: 1
- minDetectionConfidence: 0.5
- enableSegmentation: false
- Procesar cada foto de forma independiente

### UI/UX
- Diseño responsive (mobile-first)
- Colores: azul primary (#3B82F6), verde success (#10B981), gris neutral
- Feedback visual claro en cada paso
- Manejo de errores (foto sin pose detectada, datos inválidos, formato incorrecto)
- Loading states con spinner
- Todo el estado se maneja con useState (no persistencia)

### TypeScript Interfaces Necesarias
```typescript
interface UserData {
  height: number; // cm
  weight: number; // kg
}

interface Photos {
  front: File | null;
  back: File | null;
  left: File | null;
  right: File | null;
}

interface PoseLandmarks {
  landmarks: NormalizedLandmarkList;
  imageWidth: number;
  imageHeight: number;
}

interface BodyMeasurements {
  neck: number;
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  thigh: number;
  calf: number;
  bicep: number;
}
```

## Instrucciones de Implementación
1. Crear proyecto Next.js con TypeScript y Tailwind CSS
2. Instalar dependencias: @mediapipe/pose, @mediapipe/drawing_utils
3. Implementar flujo de 3 pasos con estado local (useState)
4. Crear componente de upload con drag & drop y preview
5. Integrar MediaPipe para detección de pose en navegador
6. Implementar algoritmo de calibración usando altura del usuario
7. Calcular las 8 medidas corporales usando landmarks específicos
8. Mostrar resultados con formato claro y opción de reiniciar
9. Las fotos solo existen en memoria, se limpian al reiniciar

## Consideraciones Adicionales
- Sin backend, sin API, sin base de datos
- Las fotos NO se envían a ningún servidor
- Todo el procesamiento es local en el navegador
- Al refrescar la página o reiniciar, se pierde toda la información
- Priorizar funcionalidad MVP sobre perfección del algoritmo
- El peso se captura pero inicialmente puede no usarse en cálculos (dejar para iteraciones futuras)

## Objetivo
Una aplicación funcional completamente client-side que procese las fotos localmente y muestre medidas corporales aproximadas usando computer vision en el navegador.