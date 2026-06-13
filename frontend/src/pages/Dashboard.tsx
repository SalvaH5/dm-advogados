import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { Users, Scale, FolderOpen, Clock, Bell, TrendingUp } from 'lucide-react';
import { dashboardService } from '../services/clientes';
import { Link } from 'react-router-dom';

interface Stats {
  clientes_ativos: number;
  processos_ativos: number;
  total_documentos: number;
  prazos_proximos: number;
  publicacoes_novas: number;
  leads_ativos: number;
}

function getFirstName(nome: string) {
  return nome?.split(' ')[0] || '';
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    dashboardService.stats().then(r => setStats(r.data.data)).catch(console.error);
  }, []);

  const cards = [
    { label: 'Clientes Ativos',   value: stats?.clientes_ativos,   icon: Users,       to: '/clientes',    color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Processos Ativos',  value: stats?.processos_ativos,  icon: Scale,       to: '/processos',   color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Documentos',        value: stats?.total_documentos,  icon: FolderOpen,  to: '/documentos',  color: 'text-gray-600', bg: 'bg-gray-100' },
    { label: 'Prazos (7 dias)',   value: stats?.prazos_proximos,   icon: Clock,       to: '/prazos',      color: stats?.prazos_proximos ? 'text-orange-600' : 'text-gray-600', bg: stats?.prazos_proximos ? 'bg-orange-50' : 'bg-gray-100' },
    { label: 'Publicações Novas', value: stats?.publicacoes_novas, icon: Bell,        to: '/publicacoes', color: stats?.publicacoes_novas ? 'text-blue-600' : 'text-gray-600', bg: stats?.publicacoes_novas ? 'bg-blue-50' : 'bg-gray-100' },
    { label: 'Leads Ativos',      value: stats?.leads_ativos,      icon: TrendingUp,  to: '/leads',       color: 'text-gray-600', bg: 'bg-gray-100' },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-primary-800">
          Olá, {getFirstName(user?.nome || '')}
        </h1>
        <p className="text-primary-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((s) => (
          <Link key={s.label} to={s.to} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`${s.bg} ${s.color} p-2 rounded-lg`}>
                <s.icon size={18} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary-800">
              {stats ? (s.value ?? 0) : '—'}
            </p>
            <p className="text-xs text-primary-400 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
          <div>
            <h2 className="font-semibold text-primary-800 mb-1">Fase 2A — Prazos, Publicações e Leads</h2>
            <p className="text-sm text-primary-500">
              Módulos de prazos com cálculo em dias úteis, monitoramento de publicações via DataJud e CRM de leads implementados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
