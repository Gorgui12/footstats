import Link from "next/link";
import { FOOTER_NAVIGATION } from "@/config/navigation";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/10 pb-24 pt-8 md:pb-8">
      <div className="container-app flex flex-col gap-4 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} FootStats Africa — Project WinMax</p>
        <nav className="flex flex-wrap gap-4">
          {FOOTER_NAVIGATION.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white/80">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
