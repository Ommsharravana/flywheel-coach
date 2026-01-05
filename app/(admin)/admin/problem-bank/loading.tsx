import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function ProblemBankLoading() {
  return <TableSkeleton rows={8} columns={4} showHeader showStats statsCount={3} />
}
