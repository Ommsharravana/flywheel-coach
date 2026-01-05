import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function CurateLoading() {
  return <TableSkeleton rows={8} columns={5} showHeader showStats={false} />
}
