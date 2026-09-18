import Link from "next/link";

export function SectionHeader({
  title,
  href,
  hrefLabel = "Tout voir",
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {href && (
        <Link href={href} className="text-sm text-brand-300 hover:text-brand-100">
          {hrefLabel} →
        </Link>
      )}
    </div>
  );
}
