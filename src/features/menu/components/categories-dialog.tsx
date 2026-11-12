"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconPencil,
  IconPlus,
  IconTrash,
  IconUtensils,
} from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "../actions";
import type { MenuCategory } from "../types";
import { safeImageUrl } from "../image-url";
import { type CategoryFormErrors, validateCategoryForm } from "../validation";
import { ImageUploader } from "./image-uploader";

export type CategoriesDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MenuCategory[];
  /** Called after a successful mutation so the parent can refresh. */
  onChanged?: () => void;
};

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: string }
  | { kind: "confirm-delete"; id: string };

/**
 * Category management dialog.
 *
 * Lists every category with its item count and offers inline create / edit /
 * delete-confirm steps — all inside a single modal so the flow never stacks
 * two dialogs on top of each other.
 *
 * A category that still holds items cannot be deleted: the delete button is
 * disabled and the server refuses the request as well, so the items of a
 * category are never orphaned.
 *
 * The inner component is remounted (via `key`) whenever the dialog opens, so
 * the form always starts from the list view without a "reset on mount" effect.
 */
export function CategoriesDialog(props: CategoriesDialogProps) {
  return (
    <CategoriesDialogInner
      key={props.open ? "open" : "closed"}
      {...props}
    />
  );
}

function CategoriesDialogInner({
  open,
  onOpenChange,
  categories,
  onChanged,
}: CategoriesDialogProps) {
  const toast = useToast();

  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<CategoryFormErrors>({});
  const [saving, setSaving] = useState(false);

  const startCreate = () => {
    setMode({ kind: "create" });
    setName("");
    setImageUrl(null);
    setErrors({});
  };

  const startEdit = (category: MenuCategory) => {
    setMode({ kind: "edit", id: category.id });
    setName(category.name);
    setImageUrl(safeImageUrl(category.image_url));
    setErrors({});
  };

  const cancelForm = () => {
    setMode({ kind: "list" });
    setName("");
    setImageUrl(null);
    setErrors({});
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validation = validateCategoryForm({ name });
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      return;
    }

    setSaving(true);

    const result =
      mode.kind === "edit"
        ? await updateCategoryAction({
            id: mode.id,
            name: name.trim(),
            imageUrl,
          })
        : await createCategoryAction({ name: name.trim(), imageUrl });

    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    cancelForm();
    onChanged?.();
  };

  const handleDelete = async () => {
    if (mode.kind !== "confirm-delete") return;

    setSaving(true);
    const result = await deleteCategoryAction({ id: mode.id });
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    cancelForm();
    onChanged?.();
  };

  const isFormOpen = mode.kind === "create" || mode.kind === "edit";
  const isConfirmOpen = mode.kind === "confirm-delete";

  const editingCategory =
    mode.kind === "edit"
      ? categories.find((category) => category.id === mode.id) ?? null
      : null;

  const deletingCategory =
    mode.kind === "confirm-delete"
      ? categories.find((category) => category.id === mode.id) ?? null
      : null;

  const footer = isFormOpen ? (
    <>
      <Button variant="secondary" onClick={cancelForm} disabled={saving}>
        إلغاء
      </Button>
      <Button type="submit" form="menu-category-form" loading={saving}>
        {mode.kind === "edit" ? "حفظ التعديلات" : "حفظ التصنيف"}
      </Button>
    </>
  ) : isConfirmOpen ? (
    <>
      <Button variant="secondary" onClick={cancelForm} disabled={saving}>
        إلغاء
      </Button>
      <Button variant="danger" onClick={handleDelete} loading={saving}>
        حذف التصنيف
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={() => onOpenChange(false)}>
        إغلاق
      </Button>
      <Button icon={<IconPlus size={16} />} onClick={startCreate}>
        إضافة تصنيف
      </Button>
    </>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="إدارة التصنيفات"
      description="أنشئ تصنيفات نظّم بها الأصناف، وعدّل الأسماء والصور."
      size="md"
      footer={footer}
    >
      {isFormOpen ? (
        <form
          id="menu-category-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-5"
          noValidate
        >
          <Input
            label="اسم التصنيف"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setErrors((current) => {
                if (!current.name) return current;
                const next = { ...current };
                delete next.name;
                return next;
              });
            }}
            error={errors.name}
            placeholder="مثال: بيتزا"
            maxLength={120}
          />

          <ImageUploader
            value={imageUrl}
            onChange={setImageUrl}
            scope="category"
            label="صورة التصنيف"
            error={errors.image}
          />

          {editingCategory && editingCategory.itemCount > 0 ? (
            <p className="rounded-md bg-surface-secondary p-3 type-body-sm text-muted">
              يحتوي هذا التصنيف على {editingCategory.itemCount} صنف. يمكن تعديل
              الاسم أو الصورة، لكن لا يمكن حذفه قبل نقل أصنافه إلى تصنيف آخر.
            </p>
          ) : null}
        </form>
      ) : isConfirmOpen ? (
        <div className="flex flex-col gap-2">
          <p className="type-body-md text-foreground">
            هل تريد حذف التصنيف «{deletingCategory?.name ?? ""}» نهائيًا؟
          </p>
          <p className="type-body-sm text-muted">
            التصنيف فارغ حاليًا، لذا لا يوجد أي صنف مرتبط به. لا يمكن التراجع
            عن هذا الإجراء.
          </p>
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          icon={<IconUtensils size={22} />}
          title="لا توجد تصنيفات بعد"
          description="ابدأ بإضافة تصنيف واحد على الأقل لتوزيع الأصناف داخل القائمة."
          action={
            <Button icon={<IconPlus size={16} />} onClick={startCreate}>
              إضافة تصنيف
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {categories.map((category) => {
            const isBlocked = category.itemCount > 0;
            const thumbnailUrl = safeImageUrl(category.image_url);

            return (
              <li
                key={category.id}
                className="flex items-center gap-3 rounded-md bg-surface-secondary/70 p-2.5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface text-subtle"
                >
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <IconUtensils size={18} />
                  )}
                </span>

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate type-label text-foreground">
                    {category.name}
                  </span>
                  <span className="tabular type-body-sm text-subtle">
                    {category.itemCount === 0
                      ? "لا توجد أصناف"
                      : `${category.itemCount} صنف`}
                  </span>
                </span>

                <span className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    aria-label={`تعديل التصنيف ${category.name}`}
                    title="تعديل"
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-primary"
                  >
                    <IconPencil size={17} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode({ kind: "confirm-delete", id: category.id })}
                    disabled={isBlocked}
                    title={
                      isBlocked
                        ? "لا يمكن حذف تصنيف يحتوي على أصناف. انقل الأصناف إلى تصنيف آخر أولًا."
                        : "حذف"
                    }
                    aria-label={`حذف التصنيف ${category.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
                  >
                    <IconTrash size={17} />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}

export default CategoriesDialog;
