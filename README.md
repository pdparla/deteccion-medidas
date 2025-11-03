# Aplicación de Medidas Corporales

Aplicación web que permite obtener medidas corporales mediante el análisis de 4 fotografías usando TensorFlow.js y MoveNet.

## Características

- **Procesamiento 100% en el navegador**: Detección de pose con TensorFlow.js
- **Sistema de autenticación**: Registro e inicio de sesión seguro
- **Calibración personalizada**: Cada usuario tiene coeficientes únicos
- **Altura guardada**: No necesitas ingresarla cada vez
- **Histórico de mediciones**: Todas tus mediciones guardadas en base de datos
- **8 medidas corporales**: Cuello, hombros, pecho, cintura, cadera, muslo, gemelo, bíceps
- **Privacidad total**: Las fotos solo se procesan localmente, nunca se guardan
- **Precarga optimizada**: El modelo se carga al inicio para análisis rápido

## Tecnologías

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- TensorFlow.js + MoveNet Thunder

### Backend
- Prisma ORM
- PostgreSQL (Vercel Postgres)
- NextAuth.js (Autenticación)
- bcrypt (Encriptación de contraseñas)

## Instalación Local

### Requisitos Previos
- Node.js 18+
- npm o yarn

### Pasos

1. **Clona el repositorio**
```bash
git clone https://github.com/tu-usuario/deteccion-medidas.git
cd deteccion-medidas
```

2. **Instala dependencias**
```bash
npm install
```

3. **Configura variables de entorno**
```bash
# Copia el archivo .env de ejemplo
cp .env.example .env
```

Edita `.env` y configura:
```env
DATABASE_URL="prisma+postgres://localhost:51213/..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-tu-secret-aqui"
```

Para generar `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

4. **Inicia la base de datos local**
```bash
npx prisma dev
```

5. **Ejecuta las migraciones**
```bash
npx prisma migrate dev
```

6. **Inicia el servidor de desarrollo**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Uso

### Primera Vez
1. Regístrate con email y contraseña
2. Ingresa tu altura (solo la primera vez)
3. Sube 4 fotografías (frente, espalda, lateral izquierdo, lateral derecho)
4. Opcionalmente, calibra con tus medidas reales para mayor precisión
5. Obtén tus medidas corporales

### Siguientes Veces
1. Inicia sesión
2. Sube las 4 fotos directamente (tu altura ya está guardada)
3. Si ya calibraste, tus coeficientes personalizados se usan automáticamente

### ⚠️ REQUISITOS OBLIGATORIOS para mejores resultados

- **ROPA INTERIOR ÚNICAMENTE** - Imprescindible para mediciones precisas
- Distancia: 2-3 metros de la cámara
- Brazos ligeramente separados del cuerpo
- Fondo liso con buena iluminación
- Postura erguida, de pie, completamente visible de pies a cabeza

> **Importante:** Las fotos con ropa holgada producirán medidas significativamente incorrectas. El sistema está calibrado para ropa ajustada mínima (ropa interior).

## Despliegue en Vercel

### Opción 1: Deploy con un Click

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tu-usuario/deteccion-medidas)

### Opción 2: Deploy Manual

1. **Conecta tu repositorio con Vercel**
2. **Crea una base de datos Vercel Postgres:**
   - Ve a Storage → Create Database → Postgres
3. **Configura variables de entorno:**
   ```env
   DATABASE_URL=${POSTGRES_PRISMA_URL}
   NEXTAUTH_URL=https://tu-dominio.vercel.app
   NEXTAUTH_SECRET=tu-secret-generado
   ```
4. **Ejecuta migraciones:**
   ```bash
   DATABASE_URL="tu-url-vercel-postgres" npx prisma migrate deploy
   ```

**Para instrucciones detalladas, consulta [DEPLOYMENT.md](DEPLOYMENT.md)**

## Requisitos del Navegador

- Chrome 90+ (Recomendado)
- Firefox 88+
- Edge 90+
- Safari 14+
- Soporte para WebGL 2.0
- Conexión a internet (para cargar el modelo de TensorFlow.js)

## Nota

Las medidas son aproximadas y se basan en análisis de imagen. Para medidas precisas, se recomienda medición manual con cinta métrica.
