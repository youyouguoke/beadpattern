import type { PatternAudit } from "@/types";
import { AdminBadge } from "./AdminBadge";

interface Props {
  score?: number;
  audit?: PatternAudit | null;
  showDetails?: boolean;
}

export function AuditStatusBadge({ score = 0, audit, showDetails = false }: Props) {
  const ready = audit?.ready ?? score >= 80;
  const label = ready ? "Ready" : score === 0 ? "Missing" : "Pending";
  const variant = ready ? "success" : score === 0 ? "error" : "warning";

  return (
    <div className="inline-flex flex-col gap-1">
      <AdminBadge variant={variant}>
        {label} {score > 0 && `(${score})`}
      </AdminBadge>
      {showDetails && audit && (
        <div className="text-xs text-on-surface-variant space-y-0.5">
          {audit.missingCover && <div className="text-error">Missing cover</div>}
          {audit.missingFaq && <div className="text-error">Missing FAQ</div>}
          {audit.missingCollection && <div className="text-error">Missing collection</div>}
          {audit.missingRelated && <div className="text-error">Missing related</div>}
          {audit.missingInternalLinks && <div className="text-error">Missing links</div>}
        </div>
      )}
    </div>
  );
}
