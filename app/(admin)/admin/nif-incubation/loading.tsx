import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function NIFIncubationLoading() {
  return <TableSkeleton rows={8} columns={5} showHeader showStats statsCount={4} />
}
