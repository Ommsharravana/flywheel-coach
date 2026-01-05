import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function EventDetailLoading() {
  return <TableSkeleton rows={6} columns={4} showHeader showStats statsCount={4} />
}
