#!/bin/bash
set -e

echo "=========================================="
echo "Dev Container Setup"
echo "=========================================="
echo ""

# Install Node dependencies
echo "[1/4] Installing Node dependencies..."
npm install

# Create Python virtual environment and install dependencies
echo "[2/4] Setting up Python environment..."
python3 -m venv scripts/venv
source scripts/venv/bin/activate

# Upgrade pip
echo "[3/4] Upgrading pip and build tools..."
python -m pip install --upgrade pip setuptools wheel

# Install Python dependencies if requirements.txt exists
if [ -f "scripts/requirements.txt" ]; then
    echo "[4/4] Installing Python requirements..."
    pip install -r scripts/requirements.txt
else
    echo "[4/4] No requirements.txt found, skipping Python dependencies"
fi

# Fix line endings for shell scripts (Windows compatibility)
if command -v dos2unix &> /dev/null; then
    echo "Fixing line endings for shell scripts..."
    find scripts -name "*.sh" -type f -exec dos2unix {} \; 2>/dev/null || true
fi

echo ""
echo "=========================================="
echo "Dev Container Setup Complete!"
echo "=========================================="
echo ""
echo "Environment ready. You can now:"
echo "  - Run 'npm run dev' to start the Next.js dev server"
echo "  - Run 'source scripts/venv/bin/activate' to activate Python venv"
echo "  - Run 'python scripts/convert_deeplabv3.py' to convert the model"
echo ""
