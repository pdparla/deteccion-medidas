# Model Conversion Scripts

This directory contains scripts to convert ML models to float32 TFLite format compatible with LiteRT.js.

## Available Conversions

1. **MoveNet** - Pose detection (keypoints)
2. **DeepLabV3** - Person segmentation (body mask)

## Why This Is Needed

LiteRT.js (the browser runtime for TFLite models) **only supports `float32` and `int32` tensor types**. The pre-built MoveNet models from TensorFlow Hub use `float16` or `int8` quantization, which causes the error:

```
Failed to initialize LiteRT runtime: tensor type not supported: 3
```

This conversion removes all quantization and produces a pure float32 model.

## Prerequisites

- Python 3.8 or later
- pip (Python package manager)
- ~2GB free disk space (for TensorFlow installation)

## Quick Start

### Step 1: Setup Python Environment

```bash
# From the project root directory
cd /Users/parlaga/Documents/Workspace/Github/personal/deteccion-medidas

# Run the setup script
bash scripts/setup_conversion.sh
```

This will:
- Create a Python virtual environment in `scripts/venv/`
- Install TensorFlow, TensorFlow Hub, and NumPy
- Take 3-5 minutes depending on your internet connection

### Step 2: Convert the Model

Activate the virtual environment and run the conversion:

```bash
# Activate the virtual environment
source scripts/venv/bin/activate

# Convert MoveNet Lightning (192x192, recommended for web)
python scripts/convert_movenet.py lightning

# OR convert MoveNet Thunder (256x256, more accurate but larger)
python scripts/convert_movenet.py thunder

# Deactivate when done
deactivate
```

### Step 3: Update Your Code

After conversion, update the model path in your code:

**For Lightning (192x192):**
```typescript
// In lib/pose-detection.ts
poseModel = await loadModel('/models/movenet_lightning_f32.tflite', {
  accelerator: currentBackend,
});

// Input size is 192
const inputSize = 192;
```

**For Thunder (256x256):**
```typescript
// In lib/pose-detection.ts
poseModel = await loadModel('/models/movenet_thunder_f32.tflite', {
  accelerator: currentBackend,
});

// Input size is 256
const inputSize = 256;
```

## Model Comparison

| Model | Input Size | File Size (float32) | Accuracy | Speed |
|-------|-----------|---------------------|----------|-------|
| Lightning | 192x192 | ~13-15 MB | Good | Fast |
| Thunder | 256x256 | ~25-30 MB | Better | Slower |

**Recommendation:** Start with Lightning for web deployment - it's smaller, faster, and accuracy is sufficient for body measurements.

## What The Script Does

1. **Downloads** the MoveNet model from TensorFlow Hub
2. **Extracts** the concrete function with fixed input shape
3. **Converts** to TFLite format with NO quantization (pure float32)
4. **Saves** to `public/models/movenet_{model_name}_f32.tflite`
5. **Verifies** that all tensors are float32

## Verification Output

The script will show you the tensor details:

```
📊 Input tensor details:
   [0] Name: serving_default_input:0
       Shape: [  1 192 192   3]
       Type: <class 'numpy.int32'>

📊 Output tensor details:
   [0] Name: StatefulPartitionedCall:0
       Shape: [ 1  1 17  3]
       Type: <class 'numpy.float32'>
```

**Important:** The output must be `float32` for LiteRT.js compatibility.

## Troubleshooting

### "Python 3 is not installed"
Install Python from https://www.python.org/downloads/ (version 3.8 or later)

### "tensorflow not found"
Make sure you activated the virtual environment:
```bash
source scripts/venv/bin/activate
```

### Conversion fails with memory error
The conversion process needs ~2GB RAM. Close other applications or try Lightning instead of Thunder.

### Model still doesn't work in browser
Check the console for errors. The model input/output types must be:
- Input: int32 (will be converted to float32 internally)
- Output: float32

## File Sizes

After conversion, you'll have:
- `movenet_lightning_f32.tflite`: ~13-15 MB (uncompressed float32)
- `movenet_thunder_f32.tflite`: ~25-30 MB (uncompressed float32)

These are larger than the quantized versions but necessary for LiteRT.js compatibility.

## Alternative: Pre-converted Models

If you have issues with Python/TensorFlow, you can also:
1. Use Google Colab (free cloud Python environment)
2. Run the conversion script there
3. Download the resulting `.tflite` file

## Cleanup

To remove the Python environment after conversion:

```bash
rm -rf scripts/venv
```

The converted models in `public/models/` will remain.
