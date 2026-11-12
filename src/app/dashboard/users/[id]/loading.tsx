import { UsersSkeleton } from "@/features/users/components/users-skeleton";

export default function UserDetailLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <UsersSkeleton />
    </div>
  );
}
