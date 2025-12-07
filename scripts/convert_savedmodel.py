#!/usr/bin/env python3
"""
Convert MoveNet SavedModel to pure float32 TFLite format compatible with LiteRT.js

Requirements:
    pip install tensorflow numpy

Usage:
    python scripts/convert_savedmodel.py
"""

import tensorflow as tf
import numpy as np
import os

def convert_savedmodel_to_float32_tflite(
    savedmodel_dir='public/models',
    output_dir='public/models',
    model_name='lightning'
):
    """
    Convert MoveNet SavedModel to float32 TFLite format.

    Args:
        savedmodel_dir: Directory containing saved_model.pb
        output_dir: Directory to save the converted model
        model_name: Name for the output file
    """

    input_sizes = {
        'lightning': 192,
        'thunder': 256
    }

    input_size = input_sizes.get(model_name, 192)

    print(f"🚀 Converting MoveNet {model_name.capitalize()} SavedModel to float32 TFLite...")
    print(f"   Input size: {input_size}x{input_size}")
    print(f"   SavedModel path: {savedmodel_dir}")

    # Step 1: Load the SavedModel
    print("\n📥 Loading SavedModel...")
    model = tf.saved_model.load(savedmodel_dir)

    # Step 2: Get the concrete function with fixed input shape
    print(f"🔧 Creating concrete function with input shape [1, {input_size}, {input_size}, 3]...")

    # MoveNet SavedModel expects int32 input
    concrete_func = model.signatures['serving_default']

    # Step 3: Convert to TFLite with float32 (NO quantization)
    print("⚙️  Converting to TFLite format (float32, no quantization)...")
    converter = tf.lite.TFLiteConverter.from_concrete_functions([concrete_func], model)

    # CRITICAL: Ensure NO quantization - all tensors remain float32
    converter.optimizations = []  # No optimizations
    converter.target_spec.supported_types = []  # No type conversions

    # Disable experimental features that might introduce quantization
    converter.experimental_new_converter = True
    converter.experimental_new_quantizer = False

    # Convert the model
    print("⚡ Running conversion...")
    tflite_model = converter.convert()

    # Step 4: Save the model
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f'movenet_{model_name}_pure_f32.tflite')

    with open(output_path, 'wb') as f:
        f.write(tflite_model)

    file_size_mb = len(tflite_model) / (1024 * 1024)
    print(f"\n✅ Model converted successfully!")
    print(f"   Output: {output_path}")
    print(f"   Size: {file_size_mb:.2f} MB")

    # Step 5: Verify the model
    print("\n🔍 Verifying model tensors...")
    interpreter = tf.lite.Interpreter(model_path=output_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    print("\n📊 Input tensor details:")
    for i, detail in enumerate(input_details):
        print(f"   [{i}] Name: {detail['name']}")
        print(f"       Shape: {detail['shape']}")
        print(f"       Type: {detail['dtype']}")

    print("\n📊 Output tensor details:")
    for i, detail in enumerate(output_details):
        print(f"   [{i}] Name: {detail['name']}")
        print(f"       Shape: {detail['shape']}")
        print(f"       Type: {detail['dtype']}")

    # Test inference
    print("\n🧪 Testing inference...")
    test_input = np.zeros((1, input_size, input_size, 3), dtype=np.int32)
    interpreter.set_tensor(input_details[0]['index'], test_input)
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])

    print(f"   Test passed! Output shape: {output.shape}")
    print(f"   Output type: {output.dtype}")

    # Check for unsupported types
    if output.dtype != np.float32:
        print(f"\n⚠️  WARNING: Output type is {output.dtype}, not float32!")
        print("   LiteRT.js may not support this model.")
    else:
        print("\n✨ Model is compatible with LiteRT.js (float32 tensors)")

    # Check all intermediate tensors
    print("\n🔍 Checking all intermediate tensors...")
    tensor_details = interpreter.get_tensor_details()
    non_float32_tensors = []

    for detail in tensor_details:
        if detail['dtype'] not in [np.float32, np.int32]:
            non_float32_tensors.append({
                'name': detail['name'],
                'type': detail['dtype'],
                'index': detail['index']
            })

    if non_float32_tensors:
        print(f"\n⚠️  WARNING: Found {len(non_float32_tensors)} tensors with unsupported types:")
        for tensor in non_float32_tensors[:5]:  # Show first 5
            print(f"   - {tensor['name']}: {tensor['type']}")
        print("   This model may NOT work with LiteRT.js!")
    else:
        print("✅ All tensors are float32 or int32 - fully compatible!")

    return output_path

if __name__ == '__main__':
    try:
        output_path = convert_savedmodel_to_float32_tflite()
        print(f"\n🎉 Done! You can now use {os.path.basename(output_path)} with LiteRT.js")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
