/**
 * Client-Side Image to WebP Converter & Compressor
 * Converts any camera/gallery image (JPG, PNG, HEIC) to modern, lightweight WebP.
 * Drastically saves Supabase storage quota (up to 95% reduction) and network bandwidth.
 */

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercentage: number;
}

export const compressImageToWebP = async (
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.82
): Promise<CompressedImageResult> => {
  return new Promise((resolve, reject) => {
    // If already a small WebP (< 250KB), return early
    if (file.type === "image/webp" && file.size < 250 * 1024) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        resolve({
          file,
          blob: file,
          dataUrl,
          originalSizeBytes: file.size,
          compressedSizeBytes: file.size,
          reductionPercentage: 0,
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Downscale while strictly preserving natural aspect ratio
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context is unavailable."));
          return;
        }

        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to jpeg if browser doesn't support webp canvas export
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    reject(new Error("Image compression failed."));
                    return;
                  }
                  const fallbackDataUrl = canvas.toDataURL("image/jpeg", 0.85);
                  const fallbackFile = new File([fallbackBlob], `${file.name.replace(/\.[^/.]+$/, "")}.jpg`, {
                    type: "image/jpeg",
                  });
                  resolve({
                    file: fallbackFile,
                    blob: fallbackBlob,
                    dataUrl: fallbackDataUrl,
                    originalSizeBytes: file.size,
                    compressedSizeBytes: fallbackBlob.size,
                    reductionPercentage: Math.max(0, Math.round(((file.size - fallbackBlob.size) / file.size) * 100)),
                  });
                },
                "image/jpeg",
                0.85
              );
              return;
            }

            const dataUrl = canvas.toDataURL("image/webp", quality);
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const webpFile = new File([blob], cleanName, { type: "image/webp" });

            resolve({
              file: webpFile,
              blob,
              dataUrl,
              originalSizeBytes: file.size,
              compressedSizeBytes: blob.size,
              reductionPercentage: Math.max(0, Math.round(((file.size - blob.size) / file.size) * 100)),
            });
          },
          "image/webp",
          quality
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Could not load image for WebP compression."));
    reader.readAsDataURL(file);
  });
};
