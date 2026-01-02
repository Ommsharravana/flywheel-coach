import { redirect } from 'next/navigation';

// Redirect old NIF Applications route to unified NIF Incubation page (Applications tab)
export default function NIFApplicationsRedirect() {
  redirect('/admin/nif-incubation?tab=applications');
}
