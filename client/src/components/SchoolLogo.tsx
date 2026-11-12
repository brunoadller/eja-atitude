import { SCHOOL_LOGO, useSchool } from '../lib/school';

/** Logo da escola (client/public/logo-escola.png); o texto alternativo vem do servidor. */
export default function SchoolLogo({ className = 'h-10 w-auto' }: { className?: string }) {
  const school = useSchool();
  return <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className={className} />;
}
