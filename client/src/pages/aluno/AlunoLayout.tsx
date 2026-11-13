import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav, NavItem } from '../../components/Sidebar';
import { NotificationsProvider } from '../../lib/notifications';
import { IoGridOutline, IoIdCardOutline, IoBookOutline, IoCalendarOutline, IoStatsChartOutline, IoWalletOutline, IoCreateOutline, IoDocumentTextOutline
 } from "react-icons/io5";

const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <IoGridOutline size={18}/>, end: true },
  { to: '/matricula', label: 'Minha Matrícula', icon: <IoIdCardOutline size={20}/> },
  { to: '/apostilas', label: 'Apostilas', icon: <IoBookOutline size={20}/> },
  { to: '/cronograma', label: 'Cronograma', icon: <IoCalendarOutline size={20}/> },
  { to: '/notas', label: 'Minhas Notas', icon: <IoStatsChartOutline size={20}/> },
  { to: '/boletos', label: 'Meus Boletos', icon: <IoWalletOutline size={20}/> },
  { to: '/secretaria', label: 'Secretaria', icon: <IoDocumentTextOutline size={20}/> },
  { to: '/contrato', label: 'Contrato', icon: <IoCreateOutline size={20} /> },
];

export default function AlunoLayout() {
  return (
    <NotificationsProvider>
      <div className="min-h-screen flex flex-col lg:flex-row">
        <Sidebar items={items} role="aluno" />
        <MobileNav items={items} />
        <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </NotificationsProvider>
  );
}
