export interface NavItem {
  label: string;
  href: string;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { label: "Accueil", href: "/" },
  { label: "Matchs", href: "/matchs" },
  { label: "Compétitions", href: "/competitions" },
  { label: "Classements", href: "/classement" },
  { label: "Actualités", href: "/actualites" },
  { label: "Mes favoris", href: "/favoris" },
];

export const FOOTER_NAVIGATION: NavItem[] = [
  { label: "À propos", href: "/a-propos" },
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Confidentialité", href: "/confidentialite" },
  { label: "Contact", href: "/contact" },
];
