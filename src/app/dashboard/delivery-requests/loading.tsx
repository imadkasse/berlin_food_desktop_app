import { DeliveryRequestsSkeleton } from "@/features/deliveries/components/delivery-requests-skeleton";

export default function DeliveryRequestsLoading() {
  return (
    <div dir="rtl" className="flex flex-col gap-6">
      <DeliveryRequestsSkeleton />
    </div>
  );
}
