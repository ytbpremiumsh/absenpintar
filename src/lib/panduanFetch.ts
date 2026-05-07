import { School, GraduationCap, ClipboardCheck, Users, Wallet, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type PanduanStep = {
  title: string;
  description: string;
  image?: string;
  bullets?: string[];
  tips?: string[];
};

export type PanduanGuide = {
  id: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  color: string;
  cover: string;
  mobileMockup: string;
  mobileMockupEnabled: boolean;
  intro: string;
  highlights: string[];
  steps: PanduanStep[];
};

const ICON_MAP: Record<string, LucideIcon> = {
  school: School,
  teacher: GraduationCap,
  "wali-kelas": ClipboardCheck,
  bendahara: Wallet,
  parent: Users,
};

export function iconForRole(roleId: string): LucideIcon {
  return ICON_MAP[roleId] ?? BookOpen;
}

export type PanduanRow = {
  id: string;
  role_id: string;
  label: string;
  short_label: string;
  intro: string;
  cover: string | null;
  mobile_mockup: string | null;
  color: string;
  highlights: unknown;
  steps: unknown;
  sort_order: number;
};

function rowToGuide(r: PanduanRow): PanduanGuide {
  return {
    id: r.role_id,
    label: r.label,
    shortLabel: r.short_label,
    icon: iconForRole(r.role_id),
    color: r.color || "from-indigo-500 to-blue-600",
    cover: r.cover || "",
    mobileMockup: r.mobile_mockup || "",
    intro: r.intro || "",
    highlights: Array.isArray(r.highlights) ? (r.highlights as string[]) : [],
    steps: Array.isArray(r.steps) ? (r.steps as PanduanStep[]) : [],
  };
}

export async function fetchPanduanGuides(): Promise<PanduanGuide[]> {
  const { data, error } = await supabase
    .from("panduan_content")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error || !data) return [];
  return (data as unknown as PanduanRow[]).map(rowToGuide);
}

export async function fetchPanduanGuide(roleId: string): Promise<PanduanGuide | null> {
  const { data, error } = await supabase
    .from("panduan_content")
    .select("*")
    .eq("role_id", roleId)
    .maybeSingle();
  if (error || !data) return null;
  return rowToGuide(data as unknown as PanduanRow);
}
