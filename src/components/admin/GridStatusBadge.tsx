import type { GridStatus } from "@/types";

interface Props {
  status: GridStatus;
}

export function GridStatusBadge({ status }: Props) {
  const variants: Record<GridStatus, string> = {
    ready: "bg-secondary-container text-green-800",
    review: "bg-primary-fixed text-blue-800",
    designing: "bg-tertiary-container text-yellow-800",
    missing: "bg-error-container text-red-800",
  };

  return <span className={`text-xs px-2 py-1 rounded-full ${variants[status]}`}>{status}</span>;
}
