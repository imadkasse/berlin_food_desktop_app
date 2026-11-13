"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

import { createProduct, updateProduct } from "../mutations";
import { safeImageUrl } from "../image-url";
import type { MenuCategory, MenuItemView } from "../types";
import {
  type ProductFormErrors,
  type ProductFormValues,
  validateProductForm,
} from "../validation";
import { ImageUploader } from "./image-uploader";

export type ProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` creates a new product, otherwise the product is edited. */
  product: MenuItemView | null;
  categories: MenuCategory[];
  /** Pre-selected category when creating a new product. */
  defaultCategoryId?: string | null;
  /** Called after a successful save so the parent can refresh its snapshot. */
  onSaved?: () => void;
};

/**
 * Create / edit dialog for a menu item.
 *
 * All validation messages are inline and written in Arabic; the mutation helper
 * repeats the same checks before touching the database.
 *
 * The form state lives in an inner component that is remounted (via `key`)
 * whenever the dialog opens or the edited product changes — that guarantees a
 * clean form without a "reset on mount" effect.
 */
export function ProductDialog(props: ProductDialogProps) {
  const { open, product } = props;

  return (
    <ProductDialogInner
      key={`${open ? "open" : "closed"}:${product?.id ?? "new"}`}
      {...props}
    />
  );
}

function ProductDialogInner({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  onSaved,
}: ProductDialogProps) {
  const toast = useToast();

  const isEditing = product !== null;

  const [values, setValues] = useState<ProductFormValues>(() =>
    product
      ? {
          name: product.name,
          description: product.description ?? "",
          price: String(product.price),
          categoryId: product.category_id ?? "",
          imageUrl: safeImageUrl(product.image_url),
          isAvailable: product.is_available ?? true,
        }
      : {
          name: "",
          description: "",
          price: "",
          categoryId: defaultCategoryId ?? "",
          imageUrl: null,
          isAvailable: true,
        },
  );

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [saving, setSaving] = useState(false);

  const setValue = <K extends keyof ProductFormValues>(
    key: K,
    value: ProductFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      // `imageUrl` is surfaced through the `image` error slot.
      const errorKey = (
        key === "imageUrl" ? "image" : key
      ) as keyof ProductFormErrors;

      if (!current[errorKey]) return current;

      const next = { ...current };
      delete next[errorKey];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateProductForm(values);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    setSaving(true);

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      price: Number(values.price.trim().replace(",", ".")),
      categoryId: values.categoryId || null,
      imageUrl: values.imageUrl,
      isAvailable: values.isAvailable,
    };

    const result = isEditing
      ? await updateProduct({ id: product.id, ...payload })
      : await createProduct(payload);

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    onOpenChange(false);
    onSaved?.();
  };

  const categoryOptions = categories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={isEditing ? "تعديل الصنف" : "إضافة صنف جديد"}
      description={
        isEditing
          ? "عدّل بيانات الصنف ثم احفظ التغييرات."
          : "أضف صنفًا إلى القائمة مع سعره وصورته وتصنيفه."
      }
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            إلغاء
          </Button>
          <Button type="submit" form="menu-product-form" loading={saving}>
            {isEditing ? "حفظ التعديلات" : "حفظ الصنف"}
          </Button>
        </>
      }
    >
      <form
        id="menu-product-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-5"
        noValidate
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="اسم الصنف"
            required
            value={values.name}
            onChange={(event) => setValue("name", event.target.value)}
            error={errors.name}
            placeholder="مثال: بيتزا مارغريتا"
            maxLength={120}
          />

          <Input
            label="السعر"
            required
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={values.price}
            onChange={(event) => setValue("price", event.target.value)}
            error={errors.price}
            hint="أدخل السعر كما يظهر للعملاء."
            placeholder="0.00"
          />
        </div>

        <Select
          label="التصنيف"
          required
          value={values.categoryId}
          onChange={(event) => setValue("categoryId", event.target.value)}
          error={errors.categoryId}
          options={categoryOptions}
          placeholder="اختر التصنيف"
          hint={
            categories.length === 0
              ? "لا توجد تصنيفات بعد — أضف تصنيفًا من زر «إدارة التصنيفات»."
              : undefined
          }
        />

        <Textarea
          label="الوصف"
          value={values.description}
          onChange={(event) => setValue("description", event.target.value)}
          error={errors.description}
          hint="وصف قصير يساعد العميل على فهم الصنف (اختياري)."
          placeholder="مثال: عجينة طازجة مع جبن موزاريلا وصوص الطماطم."
          rows={3}
          maxLength={500}
        />

        <ImageUploader
          value={values.imageUrl}
          onChange={(url) => setValue("imageUrl", url)}
          scope="product"
          error={errors.image}
        />

        <div className="rounded-md bg-surface-secondary/70 p-4">
          <Switch
            id="menu-product-availability"
            checked={values.isAvailable}
            onCheckedChange={(next) => setValue("isAvailable", next)}
            label="متاح للطلب"
            description="عند إيقاف الصنف لن يظهر للعملاء في التطبيق."
          />
        </div>
      </form>
    </Dialog>
  );
}

export default ProductDialog;
