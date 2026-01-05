import { TableSkeleton } from "@/components/ui/table-skeleton"

export default function AuditLoading() {
  return <TableSkeleton rows={10} columns={5} showHeader showStats={false} />
}
