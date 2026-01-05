import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function TrackAssignmentLoading() {
  return <TableSkeleton rows={8} columns={4} showHeader showStats={false} />
}
