interface AdminBadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "error" | "info" | "neutral";
}

const variantMap = {
  success: "bg-surface-container-low text-on-secondary-container",
  warning: "bg-tertiary-container text-on-tertiary-container",
  error: "bg-error-container text-on-error-container",
  info: "bg-primary text-on-primary-container",
  neutral: "bg-surface-container text-on-surface-variant",
};

export function AdminBadge({ children, variant = "neutral" }: AdminBadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-label-sm font-bold ${variantMap[variant]}`}>
      {children}
    </span>
  );
}
