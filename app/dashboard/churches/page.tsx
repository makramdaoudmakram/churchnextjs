import { redirect } from "next/navigation";

export default function ChurchesRedirectPage() {
  redirect("/dashboard/settings/churches");
}
