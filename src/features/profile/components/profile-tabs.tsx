"use client";

import { useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import {
  PROFILE_TABS,
  type ProfileTab,
  type ProfileView,
} from "@/features/profile/types";
import { AccountDetails } from "@/features/profile/components/account-details";
import { AppearanceSettings } from "@/features/profile/components/appearance-settings";
import { PasswordForm } from "@/features/profile/components/password-form";
import { PersonalDetailsForm } from "@/features/profile/components/personal-details-form";

const TAB_META: Record<ProfileTab, { title: string; description: string }> = {
  personal: {
    title: "المعلومات الشخصية",
    description: "حدّث اسمك ورقم هاتفك وعنوانك الظاهر في سجلات المنصة.",
  },
  account: {
    title: "تفاصيل الحساب",
    description: "بيانات حسابك الإداري كما يعرضها النظام — للعرض فقط.",
  },
  password: {
    title: "كلمة المرور",
    description: "غيّر كلمة المرور وتحكّم في الجلسات المفتوحة على حسابك.",
  },
  appearance: {
    title: "المظهر",
    description: "اختر السمة الفاتحة أو الداكنة للوحة التحكم.",
  },
};

/**
 * The tabbed panel of the profile page.
 *
 * Owns the active tab so the identity column on the right stays static while
 * the content on the left switches between the four sections.
 */
export type ProfileTabsProps = {
  view: ProfileView;
  /** Called after the profile is updated so the page can refresh its data. */
  onProfileUpdated?: () => void | Promise<void>;
};

export function ProfileTabs({ view, onProfileUpdated }: ProfileTabsProps) {
  const [tab, setTab] = useState<ProfileTab>("personal");
  const meta = TAB_META[tab];

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ProfileTab)}
        tabs={PROFILE_TABS.map((item) => ({
          value: item.value,
          label: item.label,
        }))}
        aria-label="أقسام الملف الشخصي"
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-1">
            <CardTitle>{meta.title}</CardTitle>
            <CardDescription>{meta.description}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {tab === "personal" ? (
            <PersonalDetailsForm view={view} onSaved={onProfileUpdated} />
          ) : null}
          {tab === "account" ? (
            <AccountDetails view={view} onGoToPersonal={() => setTab("personal")} />
          ) : null}
          {tab === "password" ? <PasswordForm /> : null}
          {tab === "appearance" ? <AppearanceSettings /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfileTabs;
