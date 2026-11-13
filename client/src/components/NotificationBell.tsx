import { IoNotificationsOutline } from 'react-icons/io5';
import { NavLink } from 'react-router-dom';
import { useNotifications } from '../lib/notifications';

/** Endereço da página de notificações (o mesmo para aluno e secretaria). */
export const NOTIFICATIONS_PATH = '/notificacoes';

/** Sino com o número de não lidas; leva à página "Notificações". */
export default function NotificationBell() {
  const { unread } = useNotifications();
  const label = unread === 0 ? 'Notificações' : `Notificações: ${unread} não lida${unread > 1 ? 's' : ''}`;

  return (
    <NavLink
      to={NOTIFICATIONS_PATH}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `relative grid place-items-center w-9 h-9 rounded-lg shrink-0 transition ${
          isActive ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-neutral-50 hover:text-slate-900'
        }`
      }
    >
      <IoNotificationsOutline size={22} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-semibold grid place-items-center leading-none">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </NavLink>
  );
}
