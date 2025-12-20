import { redirect } from 'next/navigation'

// With Google-only auth, signup and login are the same
// Redirect to login page
export default function SignupPage() {
  redirect('/login')
}
