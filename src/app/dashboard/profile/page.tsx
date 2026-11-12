import { PageHeader } from "@/components/dashboard/page-header";
import { requireSession } from "@/lib/auth/session";
import { getAvatarUrl, toProfileView } from "@/services/profile";
import { AccountSummaryCard } from "@/features/profile/components/account-summary-card";
import { ProfileIdentityCard } from "@/features/profile/components/profile-identity-card";
import { ProfileTabs } from "@/features/profile/components/profile-tabs";

/**
 * The profile page always renders the *current* administrator — a signed-in
 * user can never browse or edit somebody else's profile from here.
 */
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireSession();

  // The `avatars` bucket has no `avatar_url` column on `profiles`, so the
  // picture is located by listing the user's own folder in the bucket.
  const avatarUrl = await getAvatarUrl(session.user.id);

  const view = toProfileView(session, avatarUrl);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="الملف الشخصي"
        description="أدر بياناتك الشخصية وكلمة المرور ومظهر لوحة التحكم."
      />

      <div className="grid grid-cols-12 gap-6">
        {/* الهوية — العمود الأيمن (RTL) */}
        <aside className="col-span-12 flex flex-col gap-4 self-start lg:sticky lg:top-6 lg:col-span-4 xl:col-span-3">
          <ProfileIdentityCard view={view} />
          <AccountSummaryCard view={view} />
        </aside>

        {/* المحتوى — العمود الأيسر (RTL) */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9">
          <ProfileTabs view={view} />
        </section>
      </div>
    </div>
  );
}
