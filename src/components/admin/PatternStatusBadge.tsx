import type { PatternStatus, GridStatus } from "@/types";
import { AdminBadge } from "./AdminBadge";

interface Props {
  status: PatternStatus;
}

export function PatternStatusBadge({ status }: Props) {
  const variants: Record<PatternStatus, "success" | "warning" | "neutral" | "error" | "info"> = {
    published: "success",
    draft: "warning",
    archived: "neutral",
  };

  return <AdminBadge variant={variants[status]}>{status}</AdminBadge>;
}

interface GridProps {
  status: GridStatus;
}

export function GridStatusBadge({ status }: GridProps) {
  const variants: Record<GridStatus, "success" | "info" | "warning" | "error"> = {
    ready: "success",
    review: "info",
    designing: "warning",
    missing: "error",
  };

  return <AdminBadge variant={variants[status]}>{status}</AdminBadge>;
}
