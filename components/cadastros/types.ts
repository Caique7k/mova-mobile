import type { LucideIcon } from "@/components/ui/lucide-icon";

export type CatalogSectionKey = "buses" | "students" | "unihub";

export type CatalogSection = {
  description: string;
  icon: Parameters<typeof LucideIcon>[0]["icon"];
  key: CatalogSectionKey;
  label: string;
  status: string;
  statusTone: "live" | "next";
};
