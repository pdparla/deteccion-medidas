# Aplicación de Medidas Corporales

Aplicación web que permite obtener medidas corporales mediante el análisis de 4 fotografías usando TensorFlow.js y MoveNet.

## Características

- **100% Frontend**: Todo el procesamiento se realiza en el navegador
- **Sin servidor**: No se envían datos a ningún servidor
- **TensorFlow.js + MoveNet**: Detección de pose de última generación
- **8 medidas**: Cuello, hombros, pecho, cintura, cadera, muslo, gemelo, bíceps
- **Privacidad total**: Las fotos nunca salen de tu navegador
- **Precarga optimizada**: El modelo se carga al inicio para análisis rápido

## Tecnologías

- Next.js 14
- TypeScript
- Tailwind CSS
- TensorFlow.js + MoveNet Thunder

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

1. Ingresa tu altura
2. Sube 4 fotografías (frente, espalda, lateral izquierdo, lateral derecho)
3. Obtén tus medidas corporales

### ⚠️ REQUISITOS OBLIGATORIOS para mejores resultados

- **ROPA INTERIOR ÚNICAMENTE** - Imprescindible para mediciones precisas
- Distancia: 2-3 metros de la cámara
- Brazos ligeramente separados del cuerpo
- Fondo liso con buena iluminación
- Postura erguida, de pie, completamente visible de pies a cabeza

> **Importante:** Las fotos con ropa holgada producirán medidas significativamente incorrectas. El sistema está calibrado para ropa ajustada mínima (ropa interior).

## Deploy

Deploy fácil con Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/deteccion-medidas)

## Requisitos

- Navegador moderno con soporte para WebGL 2.0 (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+)
- Conexión a internet (para cargar el modelo de TensorFlow.js)

## Solución de Problemas

Si encuentras algún error, consulta [TROUBLESHOOTING.md](TROUBLESHOOTING.md) para soluciones comunes.

## Nota

Las medidas son aproximadas y se basan en análisis de imagen. Para medidas precisas, se recomienda medición manual con cinta métrica.
