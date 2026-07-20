import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

export function AdminPageHeader({ title, description, actions, breadcrumbs }: AdminPageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-3">
          {breadcrumbs.map((b, i) => (
            <span key={b.label} className="flex items-center gap-2">
              {b.href ? (
                <Link href={b.href} className="hover:text-primary transition-colors">{b.label}</Link>
              ) : (
                <span className="text-on-surface">{b.label}</span>
              )}
              {i < breadcrumbs.length - 1 && <span className="material-symbols-outlined text-base">chevron_right</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-quicksand font-bold text-headline-lg text-on-surface">{title}</h1>
          {description && <p className="text-body-md text-on-surface-variant mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
