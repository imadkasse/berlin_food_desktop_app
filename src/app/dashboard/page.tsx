import Link from "next/link";

import { PageHeader } from "@/components/dashboard/page-header";
import { Section } from "@/components/dashboard/section";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DeliveryStatusBadge,
  OrderStatusBadge,
} from "@/components/dashboard/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  IconAlert,
  IconBike,
  IconCalendar,
  IconPackage,
  IconReceipt,
  IconUsers,
  IconWallet,
} from "@/components/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime, formatNumber, formatPrice, shortId } from "@/lib/format";
import { assertPermission } from "@/lib/auth/guard";
import { requireSession } from "@/lib/auth/session";
import {
  getDashboardStats,
  getRecentDeliveryRequests,
  getRecentOrders,
  getTopMenuItems,
} from "@/services/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardHomePage() {
  const session = await requireSession();

  // The dashboard reads the orders, the menu and the delivery data — the
  // `orders.read` permission is asserted before any of it is loaded.
  await assertPermission("orders.read");

  const [stats, recentOrders, deliveryRequests, topItems] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(5),
    getRecentDeliveryRequests(5),
    getTopMenuItems(5),
  ]);

  const firstName = (session.profile.full_name ?? "مشرف").split(" ")[0];
  const today = new Intl.DateTimeFormat("ar", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`أهلًا، ${firstName}`}
        description={today}
        actions={
          <Link
            href="/dashboard/orders"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 type-body-md font-semibold text-[#FDF8F3] transition-colors hover:bg-primary-hover"
          >
            عرض الطلبات
          </Link>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="طلبات اليوم"
          value={formatNumber(stats.todayOrders)}
          hint="الطلبات المسجّلة منذ منتصف الليل"
          icon={<IconReceipt size={18} />}
          tone="default"
        />
        <StatCard
          label="إيراد اليوم"
          value={formatPrice(stats.todayRevenue)}
          hint="إجمالي الطلبات غير الملغاة"
          icon={<IconWallet size={18} />}
          tone="success"
        />
        <StatCard
          label="الطلبات قيد التحضير"
          value={formatNumber(stats.preparingOrders)}
          hint="طلبات في المطبخ الآن"
          icon={<IconPackage size={18} />}
          tone="warning"
        />
        <StatCard
          label="مندوبون متاحون"
          value={formatNumber(stats.availableDeliveries)}
          hint="مندوبو توصيل جاهزون لاستلام الطلبات"
          icon={<IconBike size={18} />}
          tone="info"
        />
      </div>

      {/* Recent orders + delivery requests */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Section
          title="أحدث الطلبات"
          description="آخر خمسة طلبات وصلت إلى المنصة"
          className="xl:col-span-2"
          actions={
            <Link
              href="/dashboard/orders"
              className="type-label text-primary transition-colors hover:text-primary-hover"
            >
              عرض الكل
            </Link>
          }
          contentClassName="p-0"
        >
          {recentOrders.length === 0 ? (
            <EmptyState
              icon={<IconReceipt size={22} />}
              title="لا توجد طلبات بعد"
              description="ستظهر أحدث الطلبات هنا فور وصولها إلى المنصة."
            />
          ) : (
            <Table className="rounded-none border-0">
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>الإجمالي</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="tabular font-semibold text-foreground">
                      {shortId(order.id)}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell className="tabular">
                      {formatPrice(order.totalPrice)}
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted">
                      {formatDateTime(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Section>

        <Section
          title="آخر طلبات التوصيل"
          description="طلبات الانضمام لمندوبي التوصيل"
          actions={
            <Link
              href="/dashboard/delivery-requests"
              className="type-label text-primary transition-colors hover:text-primary-hover"
            >
              عرض الكل
            </Link>
          }
          contentClassName="p-0"
        >
          {deliveryRequests.length === 0 ? (
            <EmptyState
              icon={<IconUsers size={22} />}
              title="لا توجد طلبات توصيل"
              description="لا توجد طلبات انضمام جديدة حاليًا."
            />
          ) : (
            <ul className="divide-y divide-line/70">
              {deliveryRequests.map((request) => (
                <li
                  key={request.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate type-body-md text-foreground">
                      {request.fullName}
                    </span>
                    <span className="tabular truncate type-body-sm text-subtle">
                      {request.phoneNumber}
                    </span>
                  </div>
                  <DeliveryStatusBadge status={request.status} />
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      {/* Top selling items */}
      <Section
        title="أكثر الأصناف مبيعًا"
        description="ترتيب الأصناف حسب الكمية المطلوبة"
        actions={
          <Link
            href="/dashboard/menu"
            className="type-label text-primary transition-colors hover:text-primary-hover"
          >
            إدارة القائمة
          </Link>
        }
        contentClassName="p-0"
      >
        {topItems.length === 0 ? (
          <EmptyState
            icon={<IconPackage size={22} />}
            title="لا توجد مبيعات بعد"
            description="سيظهر ترتيب الأصناف هنا بعد تسجيل أول طلب."
          />
        ) : (
          <Table className="rounded-none border-0">
            <TableHeader>
              <TableRow>
                <TableHead>الصنف</TableHead>
                <TableHead>الكمية المطلوبة</TableHead>
                <TableHead>الإيراد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.map((item, index) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft type-body-sm font-semibold text-primary tabular"
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="tabular">
                    {formatNumber(item.quantity)}
                  </TableCell>
                  <TableCell className="tabular">
                    {formatPrice(item.revenue)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Section>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/users"
          className="flex items-center gap-3 rounded-lg bg-surface p-5 border border-line/70 transition-colors hover:bg-surface-hover"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-primary"
          >
            <IconUsers size={18} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="type-label text-foreground">إدارة المستخدمين</span>
            <span className="type-body-sm text-subtle">
              الحسابات والأدوار
            </span>
          </span>
        </Link>

        <Link
          href="/dashboard/menu"
          className="flex items-center gap-3 rounded-lg bg-surface p-5 border border-line/70 transition-colors hover:bg-surface-hover"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-primary"
          >
            <IconPackage size={18} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="type-label text-foreground">قائمة الطعام</span>
            <span className="type-body-sm text-subtle">
              الأصناف والأسعار والتوفّر
            </span>
          </span>
        </Link>

        <Link
          href="/dashboard/delivery-requests"
          className="flex items-center gap-3 rounded-lg bg-surface p-5 border border-line/70 transition-colors hover:bg-surface-hover"
        >
          <span
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-secondary text-primary"
          >
            <IconCalendar size={18} />
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="type-label text-foreground">طلبات التوصيل</span>
            <span className="type-body-sm text-subtle">
              مراجعة طلبات المندوبين
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

export function DashboardErrorState() {
  return (
    <EmptyState
      icon={<IconAlert size={22} />}
      title="تعذّر تحميل بيانات لوحة التحكم"
      description="حدث خطأ أثناء جلب البيانات. حاول تحديث الصفحة مرة أخرى."
    />
  );
}
