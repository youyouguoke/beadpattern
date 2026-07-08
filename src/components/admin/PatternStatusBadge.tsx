import type { PatternStatus, GridStatus } from "@/types";

interface Props {
  status: PatternStatus;
}

export function PatternStatusBadge({ status }: Props) {
  const variants: Record<PatternStatus, string> = {
    published: "bg-green-100 text-green-800",
    draft: "bg-yellow-100 text-yellow-800",
    archived: "bg-gray-100 text-gray-800",
  };

  return <span className={`text-xs px-2 py-1 rounded-full ${variants[status]}`}>{status}</span>;
}

interface GridProps {
  status: GridStatus;
}

export function GridStatusBadge({ status }: GridProps) {
  const variants: Record<GridStatus, string> = {
    ready: "bg-green-100 text-green-800",
    review: "bg-blue-100 text-blue-800",
    designing: "bg-yellow-100 text-yellow-800",
    missing: "bg-red-100 text-red-800",
  };

  return <span className={`text-xs px-2 py-1 rounded-full ${variants[status]}`}>{status}</span>;
}
