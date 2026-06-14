import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { tarefasService } from '../services/clientes';

const STATUS_KANBAN: Record<string, { label: string; cor: string }> = {
  a_fazer:      { label: 'A Fazer',      cor: 'bg-gray-50 border-gray-200' },
  em_andamento: { label: 'Em Andamento', cor: 'bg-blue-50 border-blue-200' },
  aguardando:   { label: 'Aguardando',   cor: 'bg-yellow-50 border-yellow-200' },
  concluida:    { label: 'Concluída',    cor: 'bg-green-50 border-green-200' },
};

const PRIORIDADE_COR: Record<string, string> = {
  critica: 'bg-red-100 text-red-700',
  alta:    'bg-orange-100 text-orange-700',
  media:   'bg-yellow-100 text-yellow-700',
  baixa:   'bg-gray-100 text-gray-500',
};

function NovaTarefaModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    titulo: '', tipo: 'interna', prioridade: 'media', data_vencimento: '', descricao: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await tarefasService.criar(form);
      onSuccess();
      onClose();
    } catch { /* */ }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Nova Tarefa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="interna">Interna</option>
                <option value="processual">Processual</option>
                <option value="cliente">Cliente</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prioridade</label>
              <select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Data de Vencimento</label>
            <input type="date" value={form.data_vencimento} onChange={e => setForm({ ...form, data_vencimento: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
            <textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })}
              rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary-800 text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-900 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Tarefas() {
  const [view, setView] = useState<'lista' | 'kanban'>('lista');
  const [showModal, setShowModal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: listData } = useQuery({
    queryKey: ['tarefas', filtroStatus],
    queryFn: () => tarefasService.listar({ status: filtroStatus || undefined }),
    enabled: view === 'lista',
  });

  const { data: kanbanData } = useQuery({
    queryKey: ['tarefas-kanban'],
    queryFn: () => tarefasService.kanban(),
    enabled: view === 'kanban',
  });

  const tarefas: Record<string, unknown>[] = listData?.data?.data || [];
  const kanban: Record<string, Record<string, unknown>[]> = kanbanData?.data?.data || {};

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['tarefas'] });
    queryClient.invalidateQueries({ queryKey: ['tarefas-kanban'] });
  }

  async function toggleStatus(id: string, statusAtual: string) {
    const novoStatus = statusAtual === 'concluida' ? 'a_fazer' : 'concluida';
    await tarefasService.atualizarStatus(id, novoStatus);
    refresh();
  }

  async function moverKanban(id: string, novoStatus: string) {
    await tarefasService.atualizarStatus(id, novoStatus);
    queryClient.invalidateQueries({ queryKey: ['tarefas-kanban'] });
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-primary-800">Tarefas</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['lista', 'kanban'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  view === v ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                }`}>
                {v === 'lista' ? 'Lista' : 'Kanban'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
            <Plus size={16} />
            Nova Tarefa
          </button>
        </div>
      </div>

      {view === 'lista' && (
        <>
          <div className="flex gap-2 mb-4 flex-wrap">
            {(['', 'a_fazer', 'em_andamento', 'aguardando', 'concluida'] as const).map(s => (
              <button key={s} onClick={() => setFiltroStatus(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filtroStatus === s
                    ? 'bg-primary-800 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
                {s === '' ? 'Todas' : STATUS_KANBAN[s]?.label}
              </button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
            {tarefas.length === 0 ? (
              <div className="p-8 text-center">
                <CheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-400 text-sm">Nenhuma tarefa</p>
              </div>
            ) : tarefas.map(t => {
              const diasRestantes = parseInt(t.dias_restantes as string) || 0;
              return (
                <div key={t.id as string} className="p-4 flex items-center gap-4">
                  <button onClick={() => toggleStatus(t.id as string, t.status as string)}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      t.status === 'concluida' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-500'
                    }`}>
                    {t.status === 'concluida' && <span className="text-white text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {t.titulo as string}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      {t.cliente_nome && <span>{t.cliente_nome as string}</span>}
                      {t.numero_cnj && <span className="font-mono">{t.numero_cnj as string}</span>}
                      {t.data_vencimento && (
                        <span className={`flex items-center gap-1 ${
                          diasRestantes < 0 ? 'text-red-500' : diasRestantes <= 3 ? 'text-orange-500' : ''
                        }`}>
                          {diasRestantes < 0 ? <AlertTriangle size={11} /> : <Clock size={11} />}
                          {new Date((t.data_vencimento as string) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${PRIORIDADE_COR[t.prioridade as string] || ''}`}>
                    {t.prioridade as string}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Object.entries(STATUS_KANBAN).map(([status, { label, cor }]) => {
            const items = kanban[status] || [];
            return (
              <div key={status} className="flex-shrink-0 w-64">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className={`rounded-xl border-2 ${cor} min-h-40 p-2 space-y-2`}>
                  {items.map(t => (
                    <div key={t.id as string} className="bg-white rounded-lg p-3 shadow-sm">
                      <p className="text-sm font-medium text-gray-800 mb-1">{t.titulo as string}</p>
                      {t.cliente_nome && (
                        <p className="text-xs text-gray-400 mb-2">{t.cliente_nome as string}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORIDADE_COR[t.prioridade as string] || ''}`}>
                          {t.prioridade as string}
                        </span>
                        <select value={status} onChange={e => moverKanban(t.id as string, e.target.value)}
                          className="text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none">
                          {Object.entries(STATUS_KANBAN).map(([s, { label: l }]) => (
                            <option key={s} value={s}>{l}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">Vazio</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <NovaTarefaModal onClose={() => setShowModal(false)} onSuccess={refresh} />
      )}
    </div>
  );
}
