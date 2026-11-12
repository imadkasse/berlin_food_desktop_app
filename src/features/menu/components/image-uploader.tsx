"use client";

import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { cn } from "@/lib/cn";
import { IconClose, IconImage, IconUpload } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner";

import { uploadMenuImageAction } from "../actions";
import { safeImageUrl } from "../image-url";
import type { ImageScope } from "../types";
import {
  fileToBase64,
  IMAGE_ACCEPT_ATTRIBUTE,
  MAX_IMAGE_LABEL,
  validateImageFile,
} from "../validation";

export type ImageUploaderProps = {
  /** Current image URL (already uploaded). */
  value: string | null;
  /** Called with the new public URL, or `null` when the image is removed. */
  onChange: (url: string | null) => void;
  /** Where the uploaded file is stored inside the `menu_items` bucket. */
  scope: ImageScope;
  /** Heading above the drop zone. */
  label?: string;
  /** External validation message (owned by the parent form). */
  error?: string | null;
  className?: string;
};

/**
 * Drag-and-drop image picker.
 *
 * The file is validated on the client (type + size) and then uploaded through
 * a server action that re-validates both before writing to the public
 * `menu_items` storage bucket.
 */
export function ImageUploader({
  value,
  onChange,
  scope,
  label = "صورة الصنف",
  error,
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const message = error ?? localError;
  const previewUrl = safeImageUrl(value);

  const upload = useCallback(
    async (file: File) => {
      const invalid = validateImageFile(file);

      if (invalid) {
        setLocalError(invalid);
        return;
      }

      setLocalError(null);
      setUploading(true);

      try {
        const base64 = await fileToBase64(file);

        const result = await uploadMenuImageAction({
          fileName: file.name,
          base64,
          contentType: file.type,
          scope,
        });

        if (!result.ok) {
          setLocalError(result.error);
          return;
        }

        onChange(result.url ?? null);
      } catch {
        setLocalError("تعذّر رفع الصورة: حاول مرة أخرى");
      } finally {
        setUploading(false);
      }
    },
    [onChange, scope],
  );

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file) void upload(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  const handleRemove = () => {
    setLocalError(null);
    onChange(null);
  };

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center gap-4 rounded-md bg-surface-secondary p-3",
          "border border-dashed transition-colors duration-150",
          dragging ? "border-accent bg-accent-soft/60" : "border-line",
          message ? "border-danger" : null,
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md",
            value ? "bg-surface" : "bg-surface-secondary",
          )}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="معاينة الصورة"
              className="h-full w-full object-cover"
            />
          ) : (
            <IconImage size={22} className="text-subtle" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="type-label text-foreground">{label}</p>
          <p className="type-body-sm text-subtle">
            اسحب الصورة هنا أو اختر ملفًا — PNG أو JPG أو WEBP بحد أقصى{" "}
            {MAX_IMAGE_LABEL}.
          </p>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-md bg-surface px-3",
                "type-body-sm font-semibold text-foreground",
                "border border-line transition-colors hover:bg-surface-hover",
                "disabled:cursor-not-allowed disabled:opacity-55",
              )}
            >
              {uploading ? (
                <Spinner size="sm" className="text-muted" />
              ) : (
                <IconUpload size={16} />
              )}
              {uploading ? "جارٍ الرفع…" : "اختيار ملف"}
            </button>

            {value ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={uploading}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-md px-2.5",
                  "type-body-sm font-semibold text-muted transition-colors",
                  "hover:bg-surface hover:text-danger",
                  "disabled:cursor-not-allowed disabled:opacity-55",
                )}
              >
                <IconClose size={16} />
                إزالة الصورة
              </button>
            ) : null}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={IMAGE_ACCEPT_ATTRIBUTE}
          onChange={handleInputChange}
          className="sr-only"
          aria-label="اختيار صورة الصنف"
        />
      </div>

      {message ? (
        <p role="alert" className="type-body-sm text-danger">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export default ImageUploader;
