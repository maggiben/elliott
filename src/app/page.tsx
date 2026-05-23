import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";
import { pageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Portfolio tracker",
  description: SITE_DESCRIPTION,
  path: "/",
});

export default function Home() {
  return <Dashboard />;
}
