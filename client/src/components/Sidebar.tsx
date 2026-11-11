import { IoLogOut } from "react-icons/io5";
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/api';
import { ReactNode } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export default function Sidebar({ items, role }: { items: NavItem[]; role: 'admin' | 'aluno' }) {
  const { me, logout } = useAuth();
  const nome = (me?.user as any)?.name || (me?.user as any)?.user || 'Usuário';

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen px-4 py-6 lg:flex hidden">
      <div className="px-2 pb-5 border-b border-slate-200 mb-4">
        <div className="text-lg font-bold tracking-tight">
          EJA <span className="text-indigo-600">· ATITUDE</span>
        </div>
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
  return (
    <div className="lg:hidden bg-white border-b border-slate-200 overflow-x-auto flex px-3 py-2 gap-2 sticky top-0 z-40">
      <div className="font-bold text-sm px-2 shrink-0 self-center">EJA</div>
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
