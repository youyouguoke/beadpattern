interface AdminCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function AdminCard({ children, className = "", title, action }: AdminCardProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-3xl border border-outline-variant/20 p-5 lg:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="font-quicksand font-bold text-body-lg text-on-surface">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
