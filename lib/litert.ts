'use client';

import { loadLiteRt, loadAndCompile, Tensor } from '@litertjs/core';

let initPromise: Promise<void> | null = null;

export async function initLiteRT() {
  // Return existing initialization promise if already initializing or initialized
  if (initPromise) return initPromise;

  // Create new initialization promise
  initPromise = (async () => {
    try {
      await loadLiteRt('/wasm/');
      console.log('LiteRT initialized successfully');
    } catch (error) {
      // Reset promise on failure so we can retry
      initPromise = null;
      console.error('Failed to initialize LiteRT:', error);
      throw new Error('Failed to initialize LiteRT runtime');
    }
  })();

  return initPromise;
}

export interface ModelLoadOptions {
  accelerator?: 'webgpu' | 'wasm';
}

export async function loadModel(
  modelPath: string,
  options: ModelLoadOptions = {}
) {
  await initLiteRT();

  const { accelerator = 'webgpu' } = options;

  try {
    console.log(`Loading model from ${modelPath} with ${accelerator}`);
    const model = await loadAndCompile(modelPath, { accelerator });
    console.log(`Model loaded successfully with ${accelerator}`);
    return model;
  } catch (error) {
    if (accelerator === 'webgpu') {
      console.warn('WebGPU failed, falling back to WASM');
      return loadAndCompile(modelPath, { accelerator: 'wasm' });
    }
    throw error;
  }
}

export async function detectBackend(): Promise<'webgpu' | 'wasm'> {
  if (typeof navigator === 'undefined') return 'wasm';

  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as any).gpu?.requestAdapter();
      if (adapter) {
        console.log('WebGPU is available');
        return 'webgpu';
      }
    } catch (error) {
      console.warn('WebGPU detection failed:', error);
    }
  }

  console.log('Falling back to WASM');
  return 'wasm';
}

export { Tensor };
