# DevContainer Setup for Model Conversion

This devcontainer provides a **Linux environment** with both **Node.js 20** and **Python 3.12**, configured for converting ML models to TFLite format.

## Why Use DevContainer?

The `ai-edge-torch` package (needed for DeepLabV3 conversion) **only works on Linux**. On Windows, you have two options:

1. ✅ **Use this devcontainer** (recommended) - Opens a Linux container inside VSCode
2. ❌ Use WSL2 manually (more complex setup)

## Prerequisites

- **VSCode** with the **Dev Containers** extension installed
- **Docker Desktop** running on your machine

## Quick Start

### 1. Open in DevContainer

**Option A: First time opening**
1. Open this project in VSCode
2. Press `F1` or `Ctrl+Shift+P`
3. Type: `Dev Containers: Reopen in Container`
4. Wait 5-10 minutes for initial build and setup

**Option B: Prompt appears**
- VSCode may show: "Folder contains a Dev Container configuration file"
- Click **"Reopen in Container"**

### 2. Verify Setup

Once the container is ready, open a terminal in VSCode:

```bash
# Check Python
python --version  # Should show Python 3.12.x

# Check Node
node --version    # Should show v20.x.x

# Activate Python virtual environment
source scripts/venv/bin/activate

# Verify ai-edge-torch is installed
python -c "import ai_edge_torch; print('ai-edge-torch works!')"
```

### 3. Convert DeepLabV3 Model

```bash
# Make sure venv is activated
source scripts/venv/bin/activate

# Run conversion script
python scripts/convert_deeplabv3.py
```

This will create: `public/models/deeplabv3_resnet50_256.tflite`

### 4. Run Next.js Dev Server

```bash
# In a new terminal (or deactivate venv first)
npm run dev
```

Access at: http://localhost:3000

## What's Installed Automatically

The `postCreate.sh` script runs automatically and:

1. ✅ Installs Node.js dependencies (`npm install`)
2. ✅ Creates Python virtual environment at `scripts/venv/`
3. ✅ Installs all Python packages from `scripts/requirements.txt`:
   - TensorFlow 2.15+
   - PyTorch 2.0+ (CPU version)
   - ai-edge-torch (works in Linux!)
   - NumPy, TensorFlow Hub
4. ✅ Fixes line endings for shell scripts (Windows compatibility)

## Folder Structure Inside Container

```
/workspaces/deteccion-medidas/    # Your project root
├── scripts/
│   ├── venv/                      # Python virtual environment
│   ├── requirements.txt
│   ├── convert_deeplabv3.py
│   └── setup_and_convert.sh
├── public/models/                 # Output directory for .tflite files
└── .devcontainer/
    ├── Dockerfile                 # Container image definition
    ├── devcontainer.json          # Container configuration
    └── postCreate.sh              # Runs after container starts
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- Make sure Docker Desktop is running
- Restart Docker Desktop if needed

### "postCreate.sh failed"
- Open terminal and run manually:
  ```bash
  bash .devcontainer/postCreate.sh
  ```

### ai-edge-torch still fails
- This should NOT happen in the devcontainer (it's Linux)
- If it does, check the terminal output for specific errors

### Want to rebuild container from scratch
1. Press `F1` → `Dev Containers: Rebuild Container`
2. This reinstalls everything (takes 5-10 min)

## Working Outside DevContainer

If you close VSCode and want to work locally (Windows):
- Press `F1` → `Dev Containers: Reopen Locally`
- You'll be back in Windows (but can't run Python model conversion)

To go back to devcontainer:
- Press `F1` → `Dev Containers: Reopen in Container`

## File Persistence

- All files you create/modify are **persisted** on your Windows host
- The Python venv (`scripts/venv/`) is stored inside the container but recreated if needed
- Converted models in `public/models/` are **persisted** to your Windows filesystem

## Next Steps

After converting the model:

1. Update `app/processing/page.tsx`:
   ```typescript
   // Change from:
   import { segmentPerson } from '@/lib/segmentation';

   // To:
   import { segmentPerson } from '@/lib/segmentation-deeplabv3';
   ```

2. Test with your photos to verify better segmentation!

## VSCode Extensions Included

The devcontainer automatically installs:
- Python (ms-python.python)
- Pylance (ms-python.vscode-pylance)
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Ruff (charliermarsh.ruff)

## Port Forwarding

The following ports are automatically forwarded:
- **3000** - Next.js dev server
- **5432** - Database (if needed in future)

Access forwarded ports at `http://localhost:<port>` from your Windows browser.
