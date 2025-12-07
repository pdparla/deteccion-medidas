# Next Steps to Complete Setup

## 1. Download TFLite Models (REQUIRED)

The application requires two TensorFlow Lite models that are not included in the repository due to their size.

### Option A: Use the Download Script (Recommended)

```bash
./download-models.sh
```

### Option B: Manual Download

```bash
cd public/models

# MoveNet Thunder (~9MB)
curl -o movenet_thunder.tflite https://storage.googleapis.com/movenet/movenet_thunder.tflite

# Selfie Segmenter (~10MB)
curl -o selfie_segmenter.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite
```

## 2. Verify Installation

```bash
# Check that models exist
ls -lh public/models/*.tflite

# Should show:
# movenet_thunder.tflite (~9MB)
# selfie_segmenter.tflite (~10MB)

# Check WASM files were copied
ls -lh public/wasm/

# Should show 4 files from LiteRT
```

## 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 4. Test the Application

1. **Grant camera permissions** when prompted
2. **Enter your height** (e.g., 170 cm)
3. **Capture 4 photos**:
   - Front view (facing camera)
   - Right side (90° to your right)
   - Back view (back to camera)
   - Left side (90° to your left)
4. **Wait for processing** (~10-30 seconds)
5. **View your measurements**

### Tips for Good Results

- Stand 2-3 meters from camera
- Ensure full body is visible
- Use good lighting
- Wear fitted clothing
- Keep arms slightly away from body
- Maintain A-pose (arms spread)

## 5. Deploy to Vercel

### Before Deployment

The models (~19MB total) need to be accessible. Choose one option:

**Option A: Include in deployment**
```bash
# Ensure models are in public/models/
ls public/models/*.tflite

# Deploy
vercel deploy
```

**Option B: Host models externally**
1. Upload models to cloud storage (AWS S3, Google Cloud Storage, etc.)
2. Update paths in [lib/pose-detection.ts](lib/pose-detection.ts) and [lib/segmentation.ts](lib/segmentation.ts)
3. Deploy

### Deploy Command

```bash
npm run build  # Test build locally first
vercel deploy  # Deploy to Vercel
```

## 6. Troubleshooting

### Models Not Found
```
Error: Failed to load model
```
**Solution**: Download models to `public/models/` as described above

### Camera Permission Denied
```
Camera access denied
```
**Solution**: 
- Grant camera permissions in browser settings
- Use HTTPS (required except on localhost)
- Check for ad blockers or privacy extensions

### WASM Initialization Failed
```
Failed to initialize LiteRT runtime
```
**Solution**:
- Check COOP/COEP headers are set (see [next.config.js](next.config.js))
- Verify WASM files in `public/wasm/`
- Run `npm install` to trigger postinstall script

### Slow Inference
**Solutions**:
- Check if WebGPU is available (Chrome DevTools → Console)
- Close other browser tabs
- Try WASM fallback if WebGPU fails
- Consider smaller model variants

## 7. Known Issues

1. **First load is slow**: Models need to download and compile (~10-30 seconds)
2. **Mobile performance**: May be slower on mobile devices, especially older ones
3. **Safari**: WebGPU not available yet, uses WASM fallback
4. **Accuracy**: ±3-5cm variance is normal due to image analysis limitations

## 8. Optional Enhancements

- Add PWA support for offline use
- Implement model caching in IndexedDB
- Add comparison mode (track measurements over time)
- Multi-language support
- Custom calibration wizard

## Need Help?

Check the [README.md](README.md) and [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) for more details.
