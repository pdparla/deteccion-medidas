#!/bin/bash

# Setup script for MoveNet model conversion

set -e

echo "🔧 Setting up Python environment for model conversion..."
echo ""

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    echo "   Please install Python 3.8 or later from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Found Python $PYTHON_VERSION"

# Create virtual environment
if [ ! -d "scripts/venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv scripts/venv
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source scripts/venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install requirements
echo "📥 Installing TensorFlow and dependencies..."
echo "   (This may take a few minutes...)"
pip install -r scripts/requirements.txt

echo ""
echo "✨ Setup complete!"
echo ""
echo "To convert MoveNet models, run:"
echo "  source scripts/venv/bin/activate"
echo "  python scripts/convert_movenet.py lightning    # For 192x192 model"
echo "  python scripts/convert_movenet.py thunder      # For 256x256 model"
echo ""
