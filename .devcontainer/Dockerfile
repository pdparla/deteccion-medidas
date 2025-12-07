# Dev container with Node.js 20 and Python 3.12
FROM mcr.microsoft.com/devcontainers/python:3.12

# Install system dependencies for ML libraries (PyTorch, TensorFlow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # For OpenCV and image processing
    ffmpeg \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libglib2.0-0 \
    libgl1 \
    # For line ending fixes (Windows/Linux compatibility)
    dos2unix \
    # Build tools for Python packages
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set up Python environment
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
