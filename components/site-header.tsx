"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "./togeldarklight";
import { signOut, useSession } from "next-auth/react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/settings/governorates": "Governorates",
  "/dashboard/settings/churches": "Churches",
  "/dashboard/settings/father-control": "Father control",
  "/dashboard/settings/cities": "Cities",
  "/dashboard/settings/areas": "Areas",
  "/dashboard/application-control": "Application control",
  "/dashboard/settings/lookups": "Lookups",
  "/dashboard/settings/address-control": "Address control",
  "/dashboard/settings/street-control": "Street control",
};

export function SiteHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/dashboard/settings") ? "Settings" : "Dashboard");

  const handleLogout = () => {
    void signOut({ callbackUrl: "/login", redirect: true });
  };

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          {session?.user?.name && (
            <span className="text-sm text-muted-foreground hidden sm:inline">{session.user.name}</span>
          )}
          <ModeToggle />
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </div>
    </header>
  );
}
