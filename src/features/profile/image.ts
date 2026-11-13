/**
 * Berlin Food — Profile picture preparation (browser only).
 *
 * Images are uploaded directly through the Supabase browser SDK, so the result
 * is returned as a `File` ready for `supabase.storage.upload`. Pictures that
 * are larger than the avatar canvas are re-encoded in the browser before
 * upload to keep storage small.
 *
 * The original file format is preserved as long as the picture already fits;
 * otherwise it is re-encoded as WebP, which keeps the alpha channel of PNG
 * images intact.
 */

/** Longest edge (px) of the stored avatar. */
export const MAX_AVATAR_EDGE = 512;

/** Files above this size are always re-encoded. */
export const MAX_DIRECT_BYTES = 200 * 1024;

/** Quality used when re-encoding a picture. */
const ENCODE_QUALITY = 0.85;

export type PreparedImage = {
  file: File;
  contentType: string;
  fileName: string;
};

async function loadBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === "function") {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("decode-failed"));
      element.src = url;
    });

    return await createImageBitmap(image);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("encode-failed"));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function replaceExtension(fileName: string, extension: string): string {
  const stem = fileName.replace(/\.[^.]+$/, "");
  return `${stem || "avatar"}.${extension}`;
}

/**
 * Prepares a picked file for upload:
 * - small pictures are returned untouched (original format and quality);
 * - large pictures are scaled down to {@link MAX_AVATAR_EDGE} and re-encoded.
 */
export async function prepareAvatarImage(file: File): Promise<PreparedImage> {
  const bitmap = await loadBitmap(file);

  const needsResize =
    bitmap.width > MAX_AVATAR_EDGE || bitmap.height > MAX_AVATAR_EDGE;
  const needsCompression = file.size > MAX_DIRECT_BYTES;

  if (!needsResize && !needsCompression) {
    bitmap.close?.();
    return { file, contentType: file.type, fileName: file.name };
  }

  try {
    const scale = Math.min(
      1,
      MAX_AVATAR_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("encode-failed");

    context.drawImage(bitmap, 0, 0, width, height);

    // WebP keeps the transparency of PNG images; JPEG is the fallback.
    let blob: Blob;
    try {
      blob = await canvasToBlob(canvas, "image/webp", ENCODE_QUALITY);
    } catch {
      blob = await canvasToBlob(canvas, "image/jpeg", ENCODE_QUALITY);
    }

    const contentType = blob.type || "image/webp";
    const extension = contentType.includes("png")
      ? "png"
      : contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : "webp";

    const fileName = replaceExtension(file.name, extension);
    const preparedFile = new File([blob], fileName, { type: contentType });

    return { file: preparedFile, contentType, fileName };
  } finally {
    bitmap.close?.();
  }
}
