"use client";

import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconPackage, IconPlus, IconSearch } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";

import { useMenuSnapshot } from "../hooks";
import {
  deleteProduct,
  updateProductAvailability,
} from "../mutations";
import type {
  AvailabilityFilter,
  MenuItemView,
  MenuSort,
} from "../types";
import { filterMenuItems, sortMenuItems } from "../utils";
import { CategoriesDialog } from "./categories-dialog";
import { CategoryRail } from "./category-rail";
import { MenuFilters } from "./menu-filters";
import { ProductCard } from "./product-card";
import { ProductDialog } from "./product-dialog";
import { ProductGridSkeleton } from "./product-grid-skeleton";

/**
 * Client shell of the Menu page.
 *
 * Holds the view state (selected category, search, availability, sorting),
 * owns every dialog, and keeps the menu snapshot fresh through the browser
 * Supabase client. Mutations trigger a local re-fetch instead of a full page
 * refresh.
 */
export function MenuView() {
  const {
    categories,
    items,
    totalItems,
    isLoading,
    error,
    refetch,
  } = useMenuSnapshot();
  const toast = useToast();

  const [query, setQuery] = useState("");
  const [availability, setAvailability] = useState<AvailabilityFilter>("all");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [sort, setSort] = useState<MenuSort>("name");

  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItemView | null>(null);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MenuItemView | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);

  const visibleItems = useMemo(() => {
    const filtered = filterMenuItems(items, {
      categoryId,
      availability,
      query,
    });

    return sortMenuItems(filtered, sort);
  }, [items, categoryId, availability, query, sort]);

  const activeCategory = categories.find(
    (category) => category.id === categoryId,
  );

  const hasFilters =
    query.trim().length > 0 ||
    availability !== "all" ||
    categoryId !== null;

  const openCreate = () => {
    setEditingProduct(null);
    setProductDialogOpen(true);
  };

  const openEdit = (item: MenuItemView) => {
    setEditingProduct(item);
    setProductDialogOpen(true);
  };

  const handleToggleAvailability = async (
    item: MenuItemView,
    next: boolean,
  ) => {
    setBusyItemId(item.id);

    const result = await updateProductAvailability({
      id: item.id,
      isAvailable: next,
    });

    setBusyItemId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    await refetch();
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;

    const result = await deleteProduct({ id: pendingDelete.id });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(result.message);
    setPendingDelete(null);
    await refetch();
  };

  const clearFilters = () => {
    setQuery("");
    setAvailability("all");
    setCategoryId(null);
    setSort("name");
  };

  const heading = activeCategory
    ? activeCategory.name
    : "كل الأصناف";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="القائمة"
          description="إدارة الأصناف والتصنيفات والأسعار وحالة التوفّر"
          actions={
            <Button icon={<IconPlus size={17} />} onClick={openCreate} disabled>
              إضافة صنف
            </Button>
          }
        />
        <ProductGridSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="القائمة"
          description="إدارة الأصناف والتصنيفات والأسعار وحالة التوفّر"
        />
        <div className="rounded-lg bg-surface p-6">
          <EmptyState
            icon={<IconPackage size={22} />}
            title="تعذّر تحميل القائمة"
            description={error}
            action={
              <Button onClick={() => void refetch()}>
                إعادة المحاولة
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="القائمة"
        description="إدارة الأصناف والتصنيفات والأسعار وحالة التوفّر"
        actions={
          <Button icon={<IconPlus size={17} />} onClick={openCreate}>
            إضافة صنف
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Category rail — right side in RTL */}
        <CategoryRail
          categories={categories}
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
          totalItems={totalItems}
          onManage={() => setCategoriesDialogOpen(true)}
          className="lg:sticky lg:top-6"
        />

        {/* Product area */}
        <div className="flex min-w-0 flex-col gap-4">
          <MenuFilters
            query={query}
            onQueryChange={setQuery}
            availability={availability}
            onAvailabilityChange={setAvailability}
            categoryId={categoryId}
            onCategoryChange={setCategoryId}
            sort={sort}
            onSortChange={setSort}
            categories={categories}
          />

          <div className="flex items-baseline justify-between gap-3 px-1">
            <h2 className="type-headline-sm text-foreground">{heading}</h2>
            <p className="tabular type-body-sm text-subtle">
              {visibleItems.length} من {totalItems}
            </p>
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-lg bg-surface">
              {hasFilters ? (
                <EmptyState
                  icon={<IconSearch size={22} />}
                  title="لا توجد نتائج مطابقة"
                  description="جرّب تعديل كلمة البحث أو مسح عوامل التصفية للعثور على الصنف المطلوب."
                  action={
                    <Button variant="secondary" onClick={clearFilters}>
                      مسح عوامل التصفية
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<IconPackage size={22} />}
                  title="لا توجد أصناف في هذا التصنيف بعد"
                  description="أضف أول صنف إلى هذا التصنيف ليظهر في القائمة للعملاء."
                  action={
                    <Button icon={<IconPlus size={16} />} onClick={openCreate}>
                      إضافة صنف
                    </Button>
                  }
                />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onEdit={openEdit}
                  onDelete={setPendingDelete}
                  onToggleAvailability={handleToggleAvailability}
                  isBusy={busyItemId === item.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories}
        defaultCategoryId={categoryId}
        onSaved={() => void refetch()}
      />

      <CategoriesDialog
        open={categoriesDialogOpen}
        onOpenChange={setCategoriesDialogOpen}
        categories={categories}
        onChanged={() => void refetch()}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title="حذف الصنف"
        description={
          pendingDelete
            ? `سيتم حذف الصنف «${pendingDelete.name}» من القائمة. الطلبات السابقة تحتفظ بسعرها وبياناتها كما هي، ولا تتأثر بالحذف.`
            : undefined
        }
        confirmLabel="حذف الصنف"
        cancelLabel="إلغاء"
        tone="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default MenuView;
