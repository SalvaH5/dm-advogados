import { useAuthStore } from '../store/authStore';
import { Users, Scale, FolderOpen, Clock } from 'lucide-react';

const stats = [
  { label: 'Clientes Ativos',  value: '—', icon: Users,      color: 'text-gray-600', bg: 'bg-gray-100' },
  { label: 'Processos Ativos', value: '—', icon: Scale,      color: 'text-gray-600', bg: 'bg-gray-100' },
  { label: 'Documentos',       value: '—', icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-100' },
  { label: 'Prazos Próximos',  value: '—', icon: Clock,      color: 'text-gray-600', bg: 'bg-gray-100' },
];

function getFirstName(nome: string) {
  return nome?.split(' ')[0] || '';
}

export default function Dashboard() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-primary-800">
          Olá, {getFirstName(user?.nome || '')}
        </h1>
        <p className="text-primary-400 text-sm mt-1">
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`${s.bg} ${s.color} p-2 rounded-lg`}>
                <s.icon size={18} strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-2xl font-bold text-primary-800">{s.value}</p>
            <p className="text-xs text-primary-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0"></div>
          <div>
            <h2 className="font-semibold text-primary-800 mb-1">Fase 1 — Sistema operacional</h2>
            <p className="text-sm text-primary-500">
              Backend, autenticação, banco de dados e estrutura base implementados.
              As funcionalidades de clientes, processos, templates e documentos estão disponíveis via API.
              Interface completa em desenvolvimento na Fase 2.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
