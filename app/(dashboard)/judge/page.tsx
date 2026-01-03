import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getEffectiveUser } from '@/lib/supabase/effective-user'
import { JudgeInterface } from './JudgeInterface'

export const metadata = {
  title: 'Judge Panel | Appathon 2.0',
  description: 'Score submissions for Appathon 2.0 Demo Day',
}

export default async function JudgePage() {
  const supabase = await createClient()
  const effectiveUser = await getEffectiveUser()

  if (!effectiveUser) {
    redirect('/login')
  }

  // Verify user exists in database
  const { data: user } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('id', effectiveUser.id)
    .maybeSingle()

  if (!user) {
    redirect('/login')
  }

  return <JudgeInterface />
}
