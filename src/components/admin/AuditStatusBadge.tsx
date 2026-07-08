import type { PatternAudit } from "@/types";

interface Props {
  score?: number;
  audit?: PatternAudit | null;
  showDetails?: boolean;
}

export function AuditStatusBadge({ score = 0, audit, showDetails = false }: Props) {
  const ready = audit?.ready ?? score >= 80;
  const label = ready ? "Ready" : score === 0 ? "Missing" : "Pending";
  const color = ready ? "bg-green-100 text-green-800" : score === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";

  return (
    <div className="inline-flex flex-col gap-1">
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
        {label} {score > 0 && `(${score})`}
      </span>
      {showDetails && audit && (
        <div className="text-xs text-secondary space-y-0.5">
          {audit.missingCover && <div className="text-red-600">Missing cover</div>}
          {audit.missingFaq && <div className="text-red-600">Missing FAQ</div>}
          {audit.missingCollection && <div className="text-red-600">Missing collection</div>}
          {audit.missingRelated && <div className="text-red-600">Missing related</div>}
          {audit.missingInternalLinks && <div className="text-red-600">Missing links</div>}
        </div>
      )}
    </div>
  );
}
