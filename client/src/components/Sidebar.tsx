import { IoClose, IoLogOut, IoMenu } from "react-icons/io5";
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { initials } from '../lib/api';
import { SCHOOL_LOGO, useSchool } from '../lib/school';
import { ReactNode, useEffect, useRef, useState } from "react";
import NotificationBell from './NotificationBell';

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

type Role = 'admin' | 'aluno';

/** Largura (px) a partir da qual o menu lateral fixo aparece; abaixo dela entra o hambúrguer. Igual ao `lg` do Tailwind. */
const DESKTOP_MIN_WIDTH = 1024;

/**
 * Links das telas + rodapé com nome, cargo e Sair.
 * É o mesmo conteúdo no menu lateral (computador) e na gaveta do hambúrguer (celular e tablet).
 * `onNavigate` avisa quem abriu o menu (a gaveta usa para fechar ao tocar num link).
 */
function MenuBody({ items, role, onNavigate }: { items: NavItem[]; role: Role; onNavigate?: () => void }) {
  const { me, logout } = useAuth();
  const nome = (me?.user as any)?.name || (me?.user as any)?.user || 'Usuário';

  return (
    <>
      <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
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
        <button className="btn-ghost btn-sm" title="Sair" aria-label="Sair" onClick={logout}>
          <IoLogOut size={25} />
        </button>
      </div>
    </>
  );
}

/** Menu lateral fixo (computador, a partir de 1024px). */
export default function Sidebar({ items, role }: { items: NavItem[]; role: Role }) {
  const school = useSchool();

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen px-4 py-6 lg:flex hidden">
      <div className="px-2 pb-5 border-b border-slate-200 mb-4 flex items-center justify-between gap-2">
        <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className="h-12 w-auto min-w-0" />
        <NotificationBell />
      </div>
      <MenuBody items={items} role={role} />
    </aside>
  );
}

/**
 * Celular e tablet (abaixo de 1024px): barra fina com ☰, logo e sino.
 * O ☰ abre uma gaveta com os links, o nome de quem está logado e o Sair.
 */
export function MobileNav({ items, role }: { items: NavItem[]; role: Role }) {
  const school = useSchool();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);

  // trocou de tela: fecha a gaveta
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    // girou/esticou a tela até o computador: o menu lateral assume, então a gaveta não pode ficar presa
    const onResize = () => { if (window.innerWidth >= DESKTOP_MIN_WIDTH) setOpen(false); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    // com a gaveta aberta, a página de trás não rola
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.body.style.overflow = previousOverflow;
      menuButtonRef.current?.focus(); // devolve o foco ao botão ☰
    };
  }, [open]);

  return (
    <>
      <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-40 flex items-center gap-2 px-3 h-14">
        <button
          ref={menuButtonRef}
          className="btn-ghost btn-sm min-h-[40px] min-w-[40px] shrink-0"
          onClick={() => setOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <IoMenu size={26} />
        </button>
        <img src={SCHOOL_LOGO} alt={school?.name ?? 'Logo da escola'} className="h-8 w-auto min-w-0 mr-auto" />
        <NotificationBell />
      </header>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* fundo escuro: tocar fora da gaveta fecha */}
          <div className="absolute inset-0 bg-slate-900/50" onClick={close} aria-hidden="true" />
          <aside
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-lg2 flex flex-col px-4 py-4"
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-900">Menu</span>
              <button className="btn-ghost btn-sm min-h-[40px] min-w-[40px]" onClick={close} aria-label="Fechar menu" autoFocus>
                <IoClose size={24} />
              </button>
            </div>
            <MenuBody items={items} role={role} onNavigate={close} />
          </aside>
        </div>
      )}
    </>
  );
}
