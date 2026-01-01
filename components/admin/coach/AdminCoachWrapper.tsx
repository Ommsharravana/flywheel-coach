'use client';

import { useState } from 'react';
import { AdminAICoachChat, AdminAICoachButton } from './AdminAICoach';

export function AdminCoachWrapper() {
  const [isCoachOpen, setIsCoachOpen] = useState(false);

  return (
    <>
      <AdminAICoachButton
        onClick={() => setIsCoachOpen(!isCoachOpen)}
        isOpen={isCoachOpen}
      />
      <AdminAICoachChat
        isOpen={isCoachOpen}
        onClose={() => setIsCoachOpen(false)}
      />
    </>
  );
}
