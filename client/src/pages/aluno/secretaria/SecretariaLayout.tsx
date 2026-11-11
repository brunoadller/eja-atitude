import { NavLink, Outlet } from 'react-router-dom';
import PageHeader from '../../../components/PageHeader';

const tabs = [
  { to: 'atestado', label: 'Atestado' },
  { to: 'diploma', label: 'Diploma' },
  { to: 'documentos', label: 'Documentos de Matrícula' },
];

export default function SecretariaLayout() {
  return (
    <>
      <PageHeader title="Secretaria" subtitle="Comprovantes, diploma e documentos de matrícula" />

      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                isActive
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </>
  );
}
