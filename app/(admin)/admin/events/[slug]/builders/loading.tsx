import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function BuildersLoading() {
  return <TableSkeleton rows={10} columns={5} showHeader showStats statsCount={3} />
}
