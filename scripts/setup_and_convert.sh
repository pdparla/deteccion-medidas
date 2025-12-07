#!/bin/bash
# Setup virtual environment and convert DeepLabV3 model
# This script works on Linux/macOS

set -e  # Exit on error

echo "=========================================="
echo "DeepLabV3 Model Conversion Setup"
echo "=========================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is not installed"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

echo "[1/4] Creating virtual environment..."
if [ ! -d "scripts/venv" ]; then
    python3 -m venv scripts/venv
    echo "Virtual environment created."
else
    echo "Virtual environment already exists."
fi

echo ""
echo "[2/4] Activating virtual environment..."
source scripts/venv/Scripts/activate

echo ""
echo "[3/4] Installing dependencies..."
python3 -m pip install --upgrade pip
python3 -m s install -r scripts/requirements.txt

echo ""
echo "[4/4] Converting DeepLabV3 model..."
python3 scripts/convert_deeplabv3.py

echo ""
echo "=========================================="
echo "Conversion Complete!"
echo "=========================================="
echo ""
echo "Model saved to: public/models/deeplabv3_resnet50_256.tflite"
echo ""
echo "Next step: Update app/processing/page.tsx to use the new model"
echo "See DEEPLABV3_SETUP.md for instructions"
echo ""
