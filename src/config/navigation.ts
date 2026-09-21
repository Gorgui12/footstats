import { Home, CalendarDays, Trophy, ListOrdered, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Dictionary } from "@/i18n/dictionaries/types";

export interface NavItem {
  labelKey: keyof Dictionary["nav"];
  href: string;
  icon: LucideIcon;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { labelKey: "home", href: "/", icon: Home },
  { labelKey: "matches", href: "/matchs", icon: CalendarDays },
  { labelKey: "competitions", href: "/competitions", icon: Trophy },
  { labelKey: "standings", href: "/classement", icon: ListOrdered },
  { labelKey: "favorites", href: "/favoris", icon: Heart },
];

export interface FooterNavItem {
  labelKey: keyof Dictionary["footer"];
  href: string;
}

export const FOOTER_NAVIGATION: FooterNavItem[] = [
  { labelKey: "about", href: "/a-propos" },
  { labelKey: "legal", href: "/mentions-legales" },
  { labelKey: "privacy", href: "/confidentialite" },
  { labelKey: "contact", href: "/contact" },
];
