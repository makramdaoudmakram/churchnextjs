import { LookupTypePageClient } from "@/components/lookups/lookup-type-page-client";



export default function JobTitlesSettingsPage() {

  return (

    <div className="@container/main flex flex-1 flex-col gap-2">

      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">

        <LookupTypePageClient

          resource="job-titles"

          title="Job titles"

          description="Employment options for charity applications."

          singularLabel="Job title"

        />

      </div>

    </div>

  );

}

