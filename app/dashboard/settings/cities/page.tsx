import { CitiesPageClient } from "@/components/cities/cities-page-client";

export default function SettingsCitiesPage() {
  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <CitiesPageClient />
      </div>
    </div>
  );
}
