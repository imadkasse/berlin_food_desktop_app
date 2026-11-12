import { Card, CardContent } from "@/components/ui/card";
import { RoleBadge } from "@/components/dashboard/status-badge";
import type { ProfileView } from "@/features/profile/types";
import { AvatarUploader } from "@/features/profile/components/avatar-uploader";

/**
 * Identity card of the signed-in administrator.
 *
 * Rendered on the right-hand side of the page (RTL) and sticks to the top
 * while the tabbed panel scrolls.
 */
export function ProfileIdentityCard({ view }: { view: ProfileView }) {
  const displayName = view.fullName?.trim() || "حساب المشرف";

  return (
    <Card className="overflow-hidden">
      <div aria-hidden="true" className="h-1.5 w-full bg-primary" />

      <CardContent className="flex flex-col items-center gap-5 py-7 text-center">
        <AvatarUploader src={view.avatarUrl} name={view.fullName} />

        <div className="flex flex-col items-center gap-2">
          <h2 className="type-headline-md text-foreground">{displayName}</h2>

          <RoleBadge role={view.role} />

          {view.email ? (
            <p
              dir="ltr"
              className="type-body-md text-muted tabular break-all"
            >
              {view.email}
            </p>
          ) : (
            <p className="type-body-md text-subtle">لا يوجد بريد إلكتروني</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileIdentityCard;
