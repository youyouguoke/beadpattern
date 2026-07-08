import type { GridStatus } from "@/types";

interface Props {
  status: GridStatus;
}

export function GridStatusBadge({ status }: Props) {
  const variants: Record<GridStatus, string> = {
    ready: "bg-green-100 text-green-800",
    review: "bg-blue-100 text-blue-800",
    designing: "bg-yellow-100 text-yellow-800",
    missing: "bg-red-100 text-red-800",
  };

  return <span className={`text-xs px-2 py-1 rounded-full ${variants[status]}`}>{status}</span>;
}
