import {
  IoBookOutline,
  IoCreateOutline, IoDocumentTextOutline,
  IoGridOutline, IoIdCardOutline,
  IoPersonCircleOutline,
  IoStatsChartOutline, IoWalletOutline
} from "react-icons/io5";
import { Outlet } from 'react-router-dom';
import Sidebar, { MobileNav, NavItem } from '../../components/Sidebar';


const items: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: <IoGridOutline size={20}  />, end: true },
  { to: '/alunos', label: 'Alunos', icon: <IoIdCardOutline size={20}/> },
  { to: '/documentos', label: 'Documentos', icon: <IoDocumentTextOutline size={20}/>},
  { to: '/notas', label: 'Notas', icon: <IoStatsChartOutline size={20}/>},
  { to: '/boletos', label: 'Boletos', icon: <IoWalletOutline  size={20}/>},
  { to: '/apostilas', label: 'Apostilas', icon: <IoBookOutline size={20}/>},
  { to: '/cronograma', label: 'Cronograma', icon: <IoCreateOutline size={20}/>},
  { to: '/minha-conta', label: 'Minha conta', icon: <IoPersonCircleOutline size={20}/>},
];

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <Sidebar items={items} role="admin" />
      <MobileNav items={items} />
      <main className="flex-1 p-6 lg:p-10 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
