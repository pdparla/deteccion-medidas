"""
Convert DeepLabV3 ResNet50 to TFLite format for body segmentation
Uses ai-edge-torch for PyTorch -> TFLite conversion
"""

import os
import torch
import torchvision
import ai_edge_torch

print("Loading DeepLabV3 ResNet50...")
# Use ResNet50 (lighter than ResNet101, still accurate)
model = torchvision.models.segmentation.deeplabv3_resnet50(
    weights=torchvision.models.segmentation.DeepLabV3_ResNet50_Weights.COCO_WITH_VOC_LABELS_V1
)
model.eval()

# DeepLabV3 expects 520x520 input for best results, but we'll use 256x256 for speed
# Input: [batch, channels, height, width] = [1, 3, 256, 256]
sample_input = (torch.randn(1, 3, 256, 256),)

print("Converting to TFLite format...")
# Convert with float32 precision
edge_model = ai_edge_torch.convert(model, sample_input)

# Create output directory if it doesn't exist
output_path = 'public/models/deeplabv3_resnet50_256.tflite'
os.makedirs(os.path.dirname(output_path), exist_ok=True)

# Export to TFLite
edge_model.export(output_path)

print(f"✅ Model exported to {output_path}")
print("""
Next steps:
1. Update lib/segmentation.ts to use this model
2. Preprocessing: ImageNet normalization (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
3. Output: Extract person class (class 15 in COCO)
""")
