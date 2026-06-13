import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, Scale, FileText, FolderOpen, LogOut, LayoutDashboard, Clock, Bell, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clientes',    icon: Users,           label: 'Clientes' },
  { to: '/processos',   icon: Scale,           label: 'Processos' },
  { to: '/prazos',      icon: Clock,           label: 'Prazos' },
  { to: '/publicacoes', icon: Bell,            label: 'Publicações' },
  { to: '/leads',       icon: TrendingUp,      label: 'Leads' },
  { to: '/templates',   icon: FileText,        label: 'Templates' },
  { to: '/documentos',  icon: FolderOpen,      label: 'Documentos' },
];

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 flex flex-col border-r border-white/10"
             style={{ background: 'linear-gradient(180deg, #111111 0%, #1A1A1A 100%)' }}>

        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm tracking-tight">DM</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Dias &amp; Menezes</p>
              <p className="text-white/40 text-xs">Advogados Associados</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-white/15 text-white font-medium'
                    : 'text-white/50 hover:bg-white/10 hover:text-white/80'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {user?.nome ? getInitials(user.nome) : 'U'}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.nome}</p>
              <p className="text-white/40 text-xs capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-white/40 hover:text-white/70 hover:bg-white/10 rounded-lg text-xs transition-all"
          >
            <LogOut size={14} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}
