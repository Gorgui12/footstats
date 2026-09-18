import { Home, Trophy, CalendarDays, ListOrdered, Newspaper, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface BaseNavItem {
  label: string;
  href: string;
}

export interface NavItem extends BaseNavItem {
  icon: LucideIcon;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { label: "Accueil", href: "/", icon: Home },
  { label: "Matchs", href: "/matchs", icon: CalendarDays },
  { label: "Compétitions", href: "/competitions", icon: Trophy },
  { label: "Classements", href: "/classement", icon: ListOrdered },
  { label: "Actualités", href: "/actualites", icon: Newspaper },
  { label: "Mes favoris", href: "/favoris", icon: Heart },
];

export const FOOTER_NAVIGATION: BaseNavItem[] = [
  { label: "À propos", href: "/a-propos" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Contact", href: "/contact" },
];
