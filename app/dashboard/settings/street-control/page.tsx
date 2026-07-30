import { StreetsPageClient } from "@/components/streets/streets-page-client";

export default function StreetControlPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <StreetsPageClient />
      </div>
    </div>
  );
}
