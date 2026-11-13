"use client";

import { PageHeader } from "@/components/dashboard/page-header";
import { useProfileView } from "@/features/profile/hooks";
import { AccountSummaryCard } from "@/features/profile/components/account-summary-card";
import { ProfileIdentityCard } from "@/features/profile/components/profile-identity-card";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";

/**
 * The profile page always renders the *current* administrator — a signed-in
 * user can never browse or edit somebody else's profile from here.
 *
 * This page is a client component because all profile reads and mutations now
 * go through the Supabase browser SDK instead of server actions.
 */
export default function ProfilePage() {
  const { profile, isLoading, error, refetch } = useProfileView();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="الملف الشخصي"
          description="أدر بياناتك الشخصية وكلمة المرور ومظهر لوحة التحكم."
        />

        <div className="grid grid-cols-12 gap-6">
          <aside className="col-span-12 flex flex-col gap-4 lg:col-span-4 xl:col-span-3">
            <div className="h-80 animate-pulse rounded-xl bg-surface-secondary" />
            <div className="h-64 animate-pulse rounded-xl bg-surface-secondary" />
          </aside>

          <section className="col-span-12 lg:col-span-8 xl:col-span-9">
            <div className="h-96 animate-pulse rounded-xl bg-surface-secondary" />
          </section>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="الملف الشخصي"
          description="أدر بياناتك الشخصية وكلمة المرور ومظهر لوحة التحكم."
        />

        <div className="rounded-xl bg-surface-secondary px-6 py-12 text-center">
          <p className="type-body-md text-danger">
            {error ?? "تعذّر تحميل الملف الشخصي."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الملف الشخصي"
        description="أدر بياناتك الشخصية وكلمة المرور ومظهر لوحة التحكم."
      />

      <div className="grid grid-cols-12 gap-6">
        {/* الهوية — العمود الأيمن (RTL) */}
        <aside className="col-span-12 flex flex-col gap-4 self-start lg:sticky lg:top-6 lg:col-span-4 xl:col-span-3">
          <ProfileIdentityCard
            view={profile}
            onAvatarChanged={() => void refetch()}
          />
          <AccountSummaryCard view={profile} />
        </aside>

        {/* المحتوى — العمود الأيسر (RTL) */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9">
          <ProfileTabs view={profile} onProfileUpdated={() => void refetch()} />
        </section>
      </div>
    </div>
  );
}
