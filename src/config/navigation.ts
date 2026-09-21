import type { Dictionary } from "@/i18n/dictionaries/types";

export interface NavItem {
  labelKey: keyof Dictionary["nav"];
  href: string;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "matches", href: "/matchs" },
  { labelKey: "competitions", href: "/competitions" },
  { labelKey: "standings", href: "/classement" },
  { labelKey: "favorites", href: "/favoris" },
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
