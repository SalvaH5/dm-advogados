import { useAuthStore } from '../store/authStore';
import { Scale, Users, FolderOpen, Calendar } from 'lucide-react';

const stats = [
  { label: 'Clientes Ativos', value: '—', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Processos Ativos', value: '—', icon: Scale, color: 'bg-green-50 text-green-600' },
  { label: 'Documentos', value: '—', icon: FolderOpen, color: 'bg-purple-50 text-purple-600' },
  { label: 'Prazos Próximos', value: '—', icon: Calendar, color: 'bg-orange-50 text-orange-600' },
];

export default function Dashboard() {
  const user = useAuthStore(s => s.user);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-600">Olá, {user?.nome?.split(' ')[0]}</h1>
        <p className="text-gray-500 text-sm mt-1">Bem-vindo ao DM Advogados</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`${s.color} p-3 rounded-xl`}>
              <s.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-3">Sistema configurado</h2>
        <p className="text-sm text-gray-500">Fase 1 implementada. Próximas funcionalidades em desenvolvimento.</p>
      </div>
    </div>
  );
}
