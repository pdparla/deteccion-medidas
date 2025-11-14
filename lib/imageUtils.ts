/**
 * Image utilities for handling EXIF orientation and preprocessing
 * This fixes the mobile photo orientation issue where EXIF metadata
 * causes dimension mismatches between visual and file dimensions
 */

/**
 * Get EXIF orientation from image file
 * Returns orientation value (1-8) or 1 if not found
 */
function getOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);

      if (view.getUint16(0, false) !== 0xFFD8) {
        // Not a JPEG
        resolve(1);
        return;
      }

      const length = view.byteLength;
      let offset = 2;

      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }

        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xFFE1) {
          // EXIF marker
          if (view.getUint32(offset += 2, false) !== 0x45786966) {
            resolve(1);
            return;
          }

          const little = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;

          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              // Orientation tag
              const orientation = view.getUint16(offset + (i * 12) + 8, little);
              resolve(orientation);
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }

      resolve(1);
    };

    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB
  });
}

/**
 * Create a properly oriented HTMLImageElement from a File
 * Handles EXIF orientation by drawing to canvas and re-extracting
 * Returns image with correct visual dimensions
 */
export async function createOrientedImage(file: File): Promise<HTMLImageElement> {
  // Get EXIF orientation
  const orientation = await getOrientation(file);

  // Load original image
  const originalImg = await loadImage(file);

  // If orientation is 1 (normal), return as-is
  if (orientation === 1) {
    return originalImg;
  }

  // Create canvas to apply rotation
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate new dimensions based on orientation
  let width = originalImg.width;
  let height = originalImg.height;

  // Orientations 5-8 involve rotation, so swap dimensions
  if (orientation >= 5 && orientation <= 8) {
    [width, height] = [height, width];
  }

  canvas.width = width;
  canvas.height = height;

  // Apply transformation based on EXIF orientation
  switch (orientation) {
    case 2:
      // Horizontal flip
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      // 180° rotation
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      // Vertical flip
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      // Vertical flip + 90° CW rotation
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      // 90° CW rotation
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      // Horizontal flip + 90° CW rotation
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      // 90° CCW rotation
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
    default:
      // Normal orientation
      break;
  }

  // Draw the image with proper orientation
  ctx.drawImage(originalImg, 0, 0);

  // Convert canvas back to image
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create blob from canvas'));
        return;
      }

      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load oriented image'));
      };

      img.src = url;
    }, file.type);
  });
}

/**
 * Load image from File using URL.createObjectURL
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Error loading image'));
    };

    img.src = url;
  });
}
