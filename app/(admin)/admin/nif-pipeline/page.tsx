import { redirect } from 'next/navigation';

// Redirect old NIF Pipeline route to unified NIF Incubation page
export default function NIFPipelineRedirect() {
  redirect('/admin/nif-incubation');
}
