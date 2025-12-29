'use client';

import { CycleNameEditor } from '@/components/shared/CycleNameEditor';
import { useRouter } from 'next/navigation';

interface CycleHeaderProps {
  cycleId: string;
  cycleName: string;
}

export function CycleHeader({ cycleId, cycleName }: CycleHeaderProps) {
  const router = useRouter();

  const handleNameChange = () => {
    // Refresh the page to update any other references to the cycle name
    router.refresh();
  };

  return (
    <CycleNameEditor
      cycleId={cycleId}
      initialName={cycleName}
      onNameChange={handleNameChange}
      className="text-3xl font-display font-bold text-stone-100"
      textClassName="text-3xl font-display font-bold text-stone-100"
    />
  );
}
