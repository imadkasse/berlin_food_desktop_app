/**
 * Client-safe validation for the Menu feature.
 *
 * The same rules are re-applied inside `src/features/menu/mutations.ts`
 * — the client validation is only there to give instant, friendly feedback.
 */

/** Image formats accepted by the uploader. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Native `accept` attribute for the file input. */
export const IMAGE_ACCEPT_ATTRIBUTE = "image/png,image/jpeg,image/webp";

/** Maximum upload size: 4 MB. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

/** Human readable maximum size, used in Arabic messages. */
export const MAX_IMAGE_LABEL = "4 ميجابايت";

/** Values held by the product form. */
export type ProductFormValues = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  imageUrl: string | null;
  isAvailable: boolean;
};

/** Field-level Arabic validation messages for the product form. */
export type ProductFormErrors = Partial<
  Record<"name" | "description" | "price" | "categoryId" | "image", string>
>;

/** Field-level Arabic validation messages for the category form. */
export type CategoryFormErrors = Partial<Record<"name" | "image", string>>;

/** Maximum accepted length of a product name. */
export const MAX_NAME_LENGTH = 120;

/** Maximum accepted length of a product description. */
export const MAX_DESCRIPTION_LENGTH = 500;

/** Validates the product form and returns Arabic messages per invalid field. */
export function validateProductForm(
  values: ProductFormValues,
): ProductFormErrors {
  const errors: ProductFormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "اسم الصنف مطلوب";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `اسم الصنف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`;
  }

  const description = values.description.trim();
  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `الوصف طويل جدًا (${MAX_DESCRIPTION_LENGTH} حرف كحد أقصى)`;
  }

  const rawPrice = values.price.trim().replace(",", ".");
  if (!rawPrice) {
    errors.price = "السعر مطلوب";
  } else {
    const price = Number(rawPrice);
    if (!Number.isFinite(price)) {
      errors.price = "السعر يجب أن يكون رقمًا صحيحًا";
    } else if (price <= 0) {
      errors.price = "السعر يجب أن يكون أكبر من صفر";
    } else if (price > 1_000_000) {
      errors.price = "السعر يجب أن يكون أقل من مليون";
    }
  }

  if (!values.categoryId) {
    errors.categoryId = "يرجى اختيار تصنيف للصنف";
  }

  return errors;
}

/** Validates the category form and returns Arabic messages per invalid field. */
export function validateCategoryForm(values: {
  name: string;
}): CategoryFormErrors {
  const errors: CategoryFormErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = "اسم التصنيف مطلوب";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `اسم التصنيف طويل جدًا (${MAX_NAME_LENGTH} حرفًا كحد أقصى)`;
  }

  return errors;
}

/**
 * Validates a picked image file.
 *
 * Returns an Arabic error message, or `null` when the file is acceptable.
 */
export function validateImageFile(file: File): string | null {
  const isAccepted = (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(
    file.type,
  );

  if (!isAccepted) {
    return "تعذّر رفع الصورة: الصيغة غير مدعومة";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return `تعذّر رفع الصورة: الحجم يتجاوز ${MAX_IMAGE_LABEL}`;
  }

  if (file.size === 0) {
    return "تعذّر رفع الصورة: الملف فارغ";
  }

  return null;
}

/** Converts a `File` into a raw base64 string (without the `data:` prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("تعذّر قراءة الملف"));
    };

    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const base64 = result.includes(",") ? result.slice(result.indexOf(",") + 1) : result;
      resolve(base64.replace(/\s/g, ""));
    };

    reader.readAsDataURL(file);
  });
}
