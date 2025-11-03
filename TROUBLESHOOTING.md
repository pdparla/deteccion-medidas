# Solución de Problemas

## Error: "Module.arguments has been replaced with plain arguments_"

### Problema
Este error ocurría cuando se intentaba usar MediaPipe instalado vía npm, que tenía problemas de compatibilidad con módulos modernos de JavaScript.

### Solución Implementada
Cambiamos **completamente de MediaPipe a TensorFlow.js con MoveNet**, que es:
- Más moderno y mantenido activamente
- Sin problemas de compatibilidad
- Más rápido en la mayoría de navegadores
- Mejor integración con Next.js

### Cambios Realizados

1. **Nuevas dependencias**:
   ```json
   "@tensorflow/tfjs": "^4.22.0",
   "@tensorflow-models/pose-detection": "^2.1.3"
   ```

2. **Modelo de detección**:
   - Antes: MediaPipe Pose (33 keypoints)
   - Ahora: **MoveNet Thunder** (17 keypoints)
   - MoveNet es más rápido y preciso para pose estimation

3. **Archivos actualizados**:
   - [lib/poseDetection.ts](lib/poseDetection.ts) - Usa TensorFlow.js MoveNet
   - [lib/calibration.ts](lib/calibration.ts) - Adaptado a 17 keypoints
   - [lib/measurements.ts](lib/measurements.ts) - Algoritmos actualizados

### Ventajas de TensorFlow.js + MoveNet

1. **Sin errores de compatibilidad**: TensorFlow.js es totalmente compatible con Next.js
2. **Más rápido**: MoveNet Thunder es muy eficiente
3. **Mejor soporte**: Mantenido activamente por Google
4. **Menor latencia**: Primera carga más rápida
5. **Funciona offline**: Una vez cargado el modelo

### Keypoints de MoveNet (17 vs 33 de MediaPipe)

MoveNet detecta estos 17 puntos clave:
- Nose (nariz)
- Left/Right Eye (ojos)
- Left/Right Ear (oídos)
- Left/Right Shoulder (hombros)
- Left/Right Elbow (codos)
- Left/Right Wrist (muñecas)
- Left/Right Hip (caderas)
- Left/Right Knee (rodillas)
- Left/Right Ankle (tobillos)

Aunque son menos puntos que MediaPipe (33), son suficientes para calcular todas las medidas corporales requeridas.

### Cómo Funciona Ahora

1. El usuario sube las 4 fotos
2. TensorFlow.js se inicializa (primera vez ~2-3 segundos)
3. MoveNet procesa cada imagen y detecta los 17 keypoints
4. Se calculan las 8 medidas corporales usando estos keypoints
5. Los resultados se muestran al usuario

### Verificación

Para verificar que funciona correctamente:

1. Abre http://localhost:3001 (o el puerto que esté usando)
2. Ve a la consola del navegador (F12)
3. Completa el flujo y sube fotos
4. Deberías ver mensajes de TensorFlow.js cargándose
5. NO deberías ver el error "Module.arguments"

## Otros Problemas Comunes

### "No se detectó pose en la imagen"

**Causas:**
- La persona no está completamente visible
- Mala iluminación
- Ropa muy holgada que oculta el cuerpo
- Foto muy borrosa o de baja calidad
- Persona sentada o en posición inusual

**Soluciones:**
- Asegúrate de que la persona esté completamente visible de pies a cabeza
- Usa buena iluminación natural o artificial
- Usa ropa ajustada
- Mantén la cámara estable para evitar fotos borrosas
- Toma las fotos a 2-3 metros de distancia
- La persona debe estar de pie, brazos ligeramente separados

### Build Falla

**Si `npm run build` falla:**
```bash
# Limpia el caché
rmdir /s /q .next node_modules

# Reinstala
npm install

# Intenta de nuevo
npm run build
```

### El servidor no inicia

**Si `npm run dev` no funciona:**
```bash
# Verifica que el puerto 3000 esté libre
# En Windows:
netstat -ano | findstr :3000

# Mata el proceso si está ocupado
taskkill /PID <PID> /F

# Intenta de nuevo
npm run dev
```

**Nota:** Next.js automáticamente usará el siguiente puerto disponible (3001, 3002, etc.) si 3000 está ocupado.

### Medidas incorrectas

**Si las medidas parecen muy incorrectas:**
- Verifica que ingresaste tu altura correctamente en cm (no en metros)
- Asegúrate de que las fotos sean de la misma persona
- Toma las fotos desde la misma distancia en todas
- Mantén la postura erguida y natural
- Los algoritmos son aproximaciones, pueden variar ±3-5cm
- MoveNet funciona mejor con personas en posición vertical estándar

### Problemas de rendimiento

**Si el análisis es muy lento:**
- La primera vez siempre es más lenta (carga del modelo)
- Reduce el tamaño de las fotos antes de subirlas (max 1920x1080)
- Cierra otras pestañas del navegador
- Usa un navegador moderno (Chrome, Edge recomendados)
- MoveNet Thunder es más pesado pero más preciso que Lighting

### Error: "Failed to load model"

**Si TensorFlow.js no puede cargar el modelo:**
- Verifica tu conexión a internet
- Limpia el caché del navegador
- Intenta en modo incógnito
- Algunos proxys/firewalls pueden bloquear la carga del modelo
- Asegúrate de que tu navegador soporte WebGL

### Compatibilidad de Navegadores

**Navegadores soportados:**
- ✅ Chrome 90+ (Recomendado)
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ❌ Internet Explorer (no soportado)

**Requisitos:**
- WebGL 2.0
- WebAssembly
- JavaScript habilitado

## Diferencias MediaPipe vs MoveNet

| Característica | MediaPipe | MoveNet Thunder |
|----------------|-----------|-----------------|
| Keypoints | 33 | 17 |
| Velocidad | Media | Rápida |
| Precisión | Alta | Muy Alta |
| Compatibilidad Next.js | ⚠️ Problemas | ✅ Perfecta |
| Tamaño modelo | ~5 MB | ~12 MB |
| Primera carga | Lenta | Media |
| Mantenimiento | Limitado | Activo |
| Documentación | Buena | Excelente |

## Soporte Técnico

Si encuentras otros problemas:
1. Revisa la consola del navegador (F12 → Console)
2. Busca errores en rojo
3. Toma un screenshot del error
4. Reporta el issue con:
   - Navegador y versión
   - Sistema operativo
   - Descripción del problema
   - Screenshot del error
   - Pasos para reproducir

---

Última actualización: 2025-11-03 (Migrado a TensorFlow.js + MoveNet)
