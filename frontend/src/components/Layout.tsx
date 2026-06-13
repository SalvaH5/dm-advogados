import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Scale, Users, FileText, FolderOpen, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes',  icon: Users,           label: 'Clientes' },
  { to: '/processos', icon: Scale,           label: 'Processos' },
  { to: '/templates', icon: FileText,        label: 'Templates' },
  { to: '/documentos',icon: FolderOpen,      label: 'Documentos' },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-primary-600 flex flex-col">
        <div className="p-5 border-b border-primary-700">
          <div className="flex items-center gap-2">
            <Scale size={22} className="text-white" />
            <span className="text-white font-bold text-sm">DM Advogados</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-primary-700">
          <div className="px-3 py-2 mb-1">
            <p className="text-white text-sm font-medium truncate">{user?.nome}</p>
            <p className="text-white/50 text-xs capitalize">{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
