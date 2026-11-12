"use client";

import { useState } from "react";

import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { IconPencil, IconTrash, IconUtensils } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { formatPrice } from "@/lib/format";

import type { MenuItemView } from "../types";
import { safeImageUrl } from "../image-url";
import { isItemAvailable } from "../utils";

export type ProductCardProps = {
  item: MenuItemView;
  /** Called when the admin asks to edit the item. */
  onEdit: (item: MenuItemView) => void;
  /** Called when the admin asks to delete the item. */
  onDelete: (item: MenuItemView) => void;
  /** Called when the availability switch is flipped. */
  onToggleAvailability: (item: MenuItemView, next: boolean) => void;
  /** Disables the availability switch while the write is in flight. */
  isBusy?: boolean;
};

/**
 * A single product tile.
 *
 * The image sits in a 16:10 tile; when there is no image — or the image
 * fails to load — a warm placeholder with a fork-and-knife glyph takes its
 * place so the grid never collapses.
 */
export function ProductCard({
  item,
  onEdit,
  onDelete,
  onToggleAvailability,
  isBusy = false,
}: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  const available = isItemAvailable(item);
  const imageUrl = safeImageUrl(item.image_url);
  const showImage = Boolean(imageUrl) && !imageFailed;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg bg-surface",
        "border border-line/70 transition-colors duration-200 hover:border-accent/45",
      )}
    >
      {/* Image tile — 16:10 */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-secondary">
        {showImage ? (
          <img
            src={imageUrl as string}
            alt={item.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-full w-full items-center justify-center bg-surface-secondary text-subtle"
          >
            <IconUtensils size={30} />
          </div>
        )}

        {/* Availability badge — always visible, never colour alone */}
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <Badge variant={available ? "success" : "neutral"} dot>
            {available ? "متاح" : "غير متاح"}
          </Badge>

          {item.categoryName ? (
            <span className="rounded-full bg-surface/85 px-2.5 py-1 type-body-sm text-muted backdrop-blur-sm">
              {item.categoryName}
            </span>
          ) : null}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="type-headline-sm line-clamp-1 text-foreground">
          {item.name}
        </h3>

        <p className="line-clamp-2 min-h-[2.6em] type-body-md text-muted">
          {item.description?.trim() || "لا يوجد وصف لهذا الصنف."}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <p className="tabular type-metric text-primary">
            {formatPrice(item.price)}
          </p>
        </div>
      </div>

      {/* Action row — revealed on hover / focus */}
      <div
        className={cn(
          "flex items-center justify-between gap-3 border-t border-line/70 px-4 py-3",
          "bg-surface-secondary/60 transition-opacity duration-200",
          "opacity-100 md:opacity-0",
          "md:group-hover:opacity-100 md:group-focus-within:opacity-100",
        )}
      >
        <Switch
          id={`availability-${item.id}`}
          checked={available}
          disabled={isBusy}
          onCheckedChange={(next) => onToggleAvailability(item, next)}
          label="متاح للطلب"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onEdit(item)}
            aria-label={`تعديل الصنف ${item.name}`}
            title="تعديل"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted",
              "transition-colors duration-150",
              "hover:bg-surface hover:text-primary",
            )}
          >
            <IconPencil size={17} />
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            aria-label={`حذف الصنف ${item.name}`}
            title="حذف"
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md text-muted",
              "transition-colors duration-150",
              "hover:bg-surface hover:text-danger",
            )}
          >
            <IconTrash size={17} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
