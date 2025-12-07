# Body Measurement App with LiteRT.js

A Next.js 14+ application for browser-based body measurement using AI. Capture 4 photos (front, right, back, left) and get 8 body measurements calculated entirely in your browser using TensorFlow Lite models via LiteRT.js.

## Features

- **100% Client-Side Processing**: All ML inference runs in the browser (WebGPU with WASM fallback)
- **Privacy First**: No server uploads - photos never leave your device
- **8 Measurements**: Neck, shoulders, chest, waist, hips, biceps, thighs, calves
- **Real-time Pose Validation**: Visual feedback during photo capture
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **ML Runtime**: LiteRT.js (@litertjs/core) for TFLite inference
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: Zustand for session management
- **Camera**: react-webcam for photo capture
- **Models**: MoveNet Thunder (pose), Selfie Segmenter (silhouette)

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd deteccion-medidas
npm install
```

The postinstall script will automatically copy LiteRT WASM files to `/public/wasm/`.

### 2. Download TFLite Models

```bash
cd public/models

# MoveNet Thunder (~9MB)
curl -o movenet_thunder.tflite https://storage.googleapis.com/movenet/movenet_thunder.tflite

# Selfie Segmenter (~10MB)
curl -o selfie_segmenter.tflite https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and grant camera permissions.

## How It Works

### Measurement Algorithm

Ellipse-based circumference from 4 orthogonal views:
- **Width** from front/back silhouette
- **Depth** from left/right silhouette
- **Circumference** ≈ π × (3(a+b) - √((3a+b)(a+3b))) (Ramanujan approximation)

### Workflow

1. **User Input**: Height in cm for calibration
2. **Capture**: 4 photos with real-time pose validation
3. **Processing**:
   - Pose detection (17 keypoints per image)
   - Person segmentation (binary mask)
   - Width extraction at body levels
   - Measurement calculation
4. **Results**: Display 8 measurements with export option

## Deployment to Vercel

```bash
vercel deploy
```

Ensure models are accessible:
- Upload to `/public/models/` before deploying, OR
- Host externally and update paths

No environment variables required - fully client-side.

## Browser Compatibility

- **WebGPU**: Chrome 113+, Edge 113+
- **WASM Fallback**: All modern browsers
- **Camera**: Requires HTTPS (localhost exempt)

## Accuracy Note

Measurements are estimates with ±3-5cm variance. For professional/medical use, consult specialists.
