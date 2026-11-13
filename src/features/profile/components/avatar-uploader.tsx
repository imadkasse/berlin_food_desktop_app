"use client";

import { useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconTrash, IconUpload } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { removeAvatar, uploadAvatar } from "@/features/profile/mutations";
import { prepareAvatarImage } from "@/features/profile/image";

/** MIME types accepted for a profile picture. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

/** Maximum accepted size of a profile picture (4 MB). */
const MAX_BYTES = 4 * 1024 * 1024;

/** The `accept` attribute of the hidden file input. */
const ACCEPT_ATTRIBUTE = "image/png,image/jpeg,image/webp";

export type AvatarUploaderProps = {
  /** Current public URL of the picture — `null` when only initials exist. */
  src?: string | null;
  /** Full name, used for the initials fallback. */
  name?: string | null;
  /** Called after a successful upload or removal so the page can refetch. */
  onAvatarChanged?: () => void;
};

/**
 * Profile picture picker.
 *
 * The picture is uploaded to the public `avatars` bucket under the user's own
 * folder (`<userId>/avatar.<ext>`) by `uploadAvatar`, which also removes any
 * previous picture so the folder never holds more than one file.
 */
export function AvatarUploader({
  src = null,
  name = null,
  onAvatarChanged,
}: AvatarUploaderProps) {
  const [preview, setPreview] = useState<string | null>(src);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const openPicker = () => inputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Allow re-selecting the very same file.
    event.target.value = "";
    if (!file) return;

    setError(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      const message = "صيغة الصورة غير مدعومة. استخدم PNG أو JPG أو WEBP.";
      setError(message);
      toast.error("تعذّر تغيير الصورة", { description: message });
      return;
    }

    if (file.size > MAX_BYTES) {
      const message = "حجم الصورة يتجاوز 4 ميغابايت.";
      setError(message);
      toast.error("تعذّر تغيير الصورة", { description: message });
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setUploading(true);

    void prepareAvatarImage(file)
      .then(async (prepared) => {
        const result = await uploadAvatar(prepared.file);

        if (result.ok) {
          // The public URL of the bucket is stable per path, so a cache
          // buster is added to always show the freshly uploaded picture.
          setPreview(
            result.url
              ? `${result.url}${result.url.includes("?") ? "&" : "?"}v=${Date.now()}`
              : localPreview,
          );
          toast.success(result.message);
          onAvatarChanged?.();
        } else {
          setPreview(src);
          setError(result.error);
          toast.error("تعذّر رفع الصورة", {
            description: result.error,
          });
        }
      })
      .catch(() => {
        setError("تعذّر قراءة الصورة. حاول مرة أخرى.");
        toast.error("تعذّر رفع الصورة", {
          description: "تعذّر قراءة الملف. اختر صورة أخرى.",
        });
      })
      .finally(() => {
        URL.revokeObjectURL(localPreview);
        setUploading(false);
      });
  };

  const handleRemove = () => {
    setRemoving(true);
    setError(null);

    void removeAvatar()
      .then((result) => {
        if (result.ok) {
          setPreview(null);
          toast.success(result.message);
          onAvatarChanged?.();
        } else {
          setError(result.error);
          toast.error("تعذّر إزالة الصورة");
        }
      })
      .catch((error: unknown) => {
        // The action already converts the guard errors into an Arabic message;
        // this branch only catches an unexpected failure (e.g. a network
        // error) and must never leave the user without a feedback.
        console.error("تعذّر إزالة الصورة:", error);
        const message = "تعذّر إزالة الصورة. حاول مرة أخرى.";
        setError(message);
        toast.error("تعذّر إزالة الصورة", { description: message });
      })
      .finally(() => {
        setRemoving(false);
      });
  };

  const busy = uploading || removing;

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={openPicker}
        disabled={busy}
        aria-label="تغيير الصورة الشخصية"
        className="group relative rounded-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Avatar src={preview} name={name} size="xl" />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-foreground/55 text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100"
        >
          <IconUpload size={20} />
        </span>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTRIBUTE}
        className="sr-only"
        onChange={handleFileChange}
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          icon={<IconUpload size={16} />}
          onClick={openPicker}
          loading={uploading}
          disabled={removing}
        >
          تغيير الصورة
        </Button>

        {preview ? (
          <Button
            variant="ghost"
            size="sm"
            icon={<IconTrash size={16} />}
            onClick={handleRemove}
            loading={removing}
            disabled={uploading}
          >
            إزالة الصورة
          </Button>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="type-body-sm text-danger">
          {error}
        </p>
      ) : (
        <p className="type-body-sm text-subtle">
          PNG أو JPG أو WEBP · بحد أقصى 4 ميغابايت
        </p>
      )}
    </div>
  );
}

export default AvatarUploader;
