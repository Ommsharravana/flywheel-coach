import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function LearnersMonitorLoading() {
  return <TableSkeleton rows={10} columns={6} showHeader showStats statsCount={4} />
}
