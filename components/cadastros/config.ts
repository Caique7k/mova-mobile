import { BusFront, Cpu, GraduationCap } from "lucide";

import type { CatalogSection } from "@/components/cadastros/types";

export const catalogSections: CatalogSection[] = [
  {
    description: "CRUD real conectado ao backend da frota.",
    icon: BusFront,
    key: "buses",
    label: "Onibus",
    status: "Integrado",
    statusTone: "live",
  },
  {
    description: "CRUD real conectado ao backend de alunos.",
    icon: GraduationCap,
    key: "students",
    label: "Alunos",
    status: "Integrado",
    statusTone: "live",
  },
  {
    description: "CRUD real conectado ao backend de devices e pairing.",
    icon: Cpu,
    key: "unihub",
    label: "UniHub",
    status: "Integrado",
    statusTone: "live",
  },
];
