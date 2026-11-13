import { IoLogOut } from "react-icons/io5";
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/api';
import { SCHOOL_ICON, SCHOOL_LOGO, useSchool } from '../lib/school';
import { ReactNode } from "react";
import NotificationBell from './NotificationBell';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export default function Sidebar({ items, role }: { items: NavItem[]; role: 'admin' | 'aluno' }) {
  const { me, logout } = useAuth();
  const school = useSchool();
  const nome = (me?.user as any)?.name || (me?.user as any)?.user || 'Usuário';

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen px-4 py-6 lg:flex hidden">
      <div className="px-2 pb-5 border-b border-slate-200 mb-4 flex items-center justify-between gap-2">
        <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className="h-12 w-auto min-w-0" />
        <NotificationBell />
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-neutral-50 hover:text-slate-900'
              }`
            }
          >
            <span className="w-5 text-center opacity-90">{it.icon}</span>
            <span>{it.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="pt-3 mt-3 border-t border-slate-200 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white grid place-items-center text-xs font-semibold shrink-0">
          {initials(nome)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{nome}</div>
          <div className="text-[11px] text-slate-500">{role === 'admin' ? 'Secretaria' : 'Aluno'}</div>
        </div>
        <button className="btn-ghost btn-sm" title="Sair" onClick={logout}>
          <IoLogOut  size={25}/>
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const school = useSchool();
  return (
    <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto flex px-3 py-2 gap-2 sticky top-0 z-40">
      <img src={SCHOOL_ICON} alt={school?.name ?? 'Logo da escola'} className="h-7 w-7 shrink-0 self-center" />
      <NotificationBell />
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.end}
          className={({ isActive }) =>
            `whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${
              isActive ? 'bg-slate-900 text-white' : 'text-slate-500'
            }`
          }
        >
          {it.icon} {it.label}
        </NavLink>
      ))}
    </div>
  );
}
