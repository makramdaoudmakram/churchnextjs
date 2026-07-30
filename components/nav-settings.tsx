"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronRightIcon,
  ChurchIcon,
  MapPinIcon,
  Settings2Icon,
  Building2Icon,
  GlobeIcon,
  UserRoundIcon,
  SignpostIcon,
  BookOpenIcon,
  HomeIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  HeartIcon,
  UserCogIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

const settingsLinks = [
  {
    title: "Governorates",
    url: "/dashboard/settings/governorates",
    icon: GlobeIcon,
  },
  {
    title: "Cities",
    url: "/dashboard/settings/cities",
    icon: Building2Icon,
  },
  {
    title: "Areas",
    url: "/dashboard/settings/areas",
    icon: MapPinIcon,
  },
  {
    title: "Street control",
    url: "/dashboard/settings/street-control",
    icon: SignpostIcon,
  },
  {
    title: "Education",
    url: "/dashboard/settings/education",
    icon: GraduationCapIcon,
  },
  {
    title: "Job titles",
    url: "/dashboard/settings/job-titles",
    icon: BriefcaseIcon,
  },
  {
    title: "Marital status",
    url: "/dashboard/settings/marital-status",
    icon: HeartIcon,
  },
  {
    title: "Relationships",
    url: "/dashboard/settings/lookups",
    icon: BookOpenIcon,
  },
  {
    title: "Supervisors",
    url: "/dashboard/settings/supervisors",
    icon: UserCogIcon,
  },
  {
    title: "Address control",
    url: "/dashboard/settings/address-control",
    icon: HomeIcon,
  },
  {
    title: "Churches",
    url: "/dashboard/settings/churches",
    icon: ChurchIcon,
  },
  {
    title: "Father control",
    url: "/dashboard/settings/father-control",
    icon: UserRoundIcon,
  },
];

export function NavSettings() {
  const pathname = usePathname();
  const isSettingsSection = settingsLinks.some((l) => pathname.startsWith(l.url));
  const [open, setOpen] = React.useState(isSettingsSection);

  React.useEffect(() => {
    if (isSettingsSection) {
      setOpen(true);
    }
  }, [isSettingsSection]);

  return (
    <SidebarGroup className="mt-auto">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              isActive={isSettingsSection}
              onClick={() => setOpen((v) => !v)}
            >
              <Settings2Icon />
              <span>Settings</span>
              <ChevronRightIcon
                className={cn("ml-auto size-4 transition-transform", open && "rotate-90")}
              />
            </SidebarMenuButton>
            {open && (
              <SidebarMenuSub>
                {settingsLinks.map((link) => (
                  <SidebarMenuSubItem key={link.url}>
                    <SidebarMenuSubButton asChild isActive={pathname === link.url}>
                      <Link href={link.url}>
                        <link.icon className="size-4" />
                        <span>{link.title}</span>
                      </Link>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
