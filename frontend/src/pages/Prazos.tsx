import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, CheckCircle, Scale } from 'lucide-react';
import { prazosService, processosService } from '../services/clientes';

type Filtro = 'todos' | 'hoje' | 'semana' | 'concluidos';

interface Prazo {
  id: string;
  titulo: string;
  data_prazo: string;
  dias_restantes: number;
  concluido: boolean;
  prioridade: string;
  tipo: string;
  processo_numero?: string;
  cliente_nome?: string;
  usuario_nome?: string;
}

interface Processo {
  id: string;
  numero: string;
  cliente_nome?: string;
}

function NovoPrazoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    processo_id: '', titulo: '', data_prazo: '', data_intimacao: '',
    tipo: 'processual', prioridade: 'media', dias_uteis: true,
    prazo_dias_uteis: ''
  });
  const [dataCalculada, setDataCalculada] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { data: processosData } = useQuery({
    queryKey: ['processos-select'],
    queryFn: () => processosService.listar({ limit: 100 }),
  });

  const processos: Processo[] = processosData?.data?.data || [];

  async function calcular() {
    if (!form.data_intimacao || !form.prazo_dias_uteis) return;
    setCalculando(true);
    try {
      const r = await prazosService.calcular({
        data_inicio: form.data_intimacao,
        dias_uteis: parseInt(form.prazo_dias_uteis),
      });
      const dataFim: string = r.data.data.data_fim;
      setDataCalculada(dataFim);
      setForm(f => ({ ...f, data_prazo: dataFim }));
    } catch {
      // silent
    } finally {
      setCalculando(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const payload: Record<string, unknown> = {
        processo_id: form.processo_id,
        titulo: form.titulo,
        tipo: form.tipo,
        prioridade: form.prioridade,
        dias_uteis: form.dias_uteis,
      };
      if (form.data_intimacao) payload.data_intimacao = form.data_intimacao;
      if (form.prazo_dias_uteis) {
        payload.prazo_dias_uteis = parseInt(form.prazo_dias_uteis);
      } else {
        payload.data_prazo = form.data_prazo;
      }
      await prazosService.criar(payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar prazo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Novo Prazo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Processo *</label>
              <select value={form.processo_id} onChange={e => setForm({ ...form, processo_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                required>
                <option value="">Selecione...</option>
                {processos.map((p: Processo) => (
                  <option key={p.id} value={p.id}>{p.numero}{p.cliente_nome ? ` — ${p.cliente_nome}` : ''}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título *</label>
              <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="processual">Processual</option>
                <option value="protocolo">Protocolo</option>
                <option value="audiencia">Audiência</option>
                <option value="reuniao">Reunião</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Prioridade</label>
              <select value={form.prioridade} onChange={e => setForm({ ...form, prioridade: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="col-span-2 border-t border-gray-100 pt-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Calcular prazo automaticamente</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data da intimação</label>
                  <input type="date" value={form.data_intimacao} onChange={e => setForm({ ...form, data_intimacao: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Dias úteis do prazo</label>
                  <div className="flex gap-2">
                    <input type="number" min="1" value={form.prazo_dias_uteis} onChange={e => setForm({ ...form, prazo_dias_uteis: e.target.value })}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <button type="button" onClick={calcular} disabled={calculando || !form.data_intimacao || !form.prazo_dias_uteis}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 disabled:opacity-50 whitespace-nowrap">
                      {calculando ? '...' : 'Calcular'}
                    </button>
                  </div>
                </div>
              </div>
              {dataCalculada && (
                <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1 mt-2">
                  Prazo calculado: {new Date(dataCalculada + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Data do prazo {!form.prazo_dias_uteis ? '*' : '(preenchida automaticamente)'}
              </label>
              <input type="date" value={form.data_prazo} onChange={e => setForm({ ...form, data_prazo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                required={!form.prazo_dias_uteis} />
            </div>
          </div>
          {erro && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
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

function diasLabel(dias: number, concluido: boolean) {
  if (concluido) return null;
  if (dias < 0) return <span className="text-xs text-red-600 font-semibold">Vencido há {Math.abs(dias)}d</span>;
  if (dias === 0) return <span className="text-xs text-orange-600 font-semibold">Vence hoje</span>;
  return <span className="text-xs text-gray-400">{dias}d restantes</span>;
}

function prioridadeColor(p: string) {
  if (p === 'urgente') return 'bg-red-100 text-red-700';
  if (p === 'alta') return 'bg-orange-100 text-orange-700';
  if (p === 'media') return 'bg-yellow-50 text-yellow-700';
  return 'bg-gray-100 text-gray-500';
}

export default function Prazos() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const params: Record<string, unknown> = {};
  if (filtro === 'concluidos') params.concluido = true;
  else params.concluido = false;
  if (filtro === 'hoje') params.vencendo_em = 0;
  if (filtro === 'semana') params.vencendo_em = 7;

  const { data, isLoading } = useQuery({
    queryKey: ['prazos', filtro],
    queryFn: () => prazosService.listar(params),
  });

  const prazos: Prazo[] = data?.data?.data || [];

  async function concluir(id: string) {
    try {
      await prazosService.concluir(id);
      queryClient.invalidateQueries({ queryKey: ['prazos'] });
    } catch {
      // silent
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary-800">Prazos</h1>
          <p className="text-primary-400 text-sm mt-0.5">{prazos.length} prazo{prazos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
          <Plus size={16} />
          Novo Prazo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex gap-2">
          {(['todos', 'hoje', 'semana', 'concluidos'] as Filtro[]).map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filtro === f ? 'bg-primary-800 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}>
              {f === 'todos' ? 'Todos' : f === 'hoje' ? 'Hoje' : f === 'semana' ? 'Esta semana' : 'Concluídos'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : prazos.length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Nenhum prazo encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {prazos.map((prazo: Prazo) => (
              <div key={prazo.id} className={`p-4 flex items-center justify-between hover:bg-gray-50 ${prazo.concluido ? 'opacity-60' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${prazo.concluido ? 'bg-green-50' : 'bg-gray-100'}`}>
                    {prazo.concluido
                      ? <CheckCircle size={18} className="text-green-500" />
                      : <Clock size={18} className="text-gray-500" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${prazo.concluido ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                        {prazo.titulo}
                      </p>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${prioridadeColor(prazo.prioridade)}`}>
                        {prazo.prioridade}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {prazo.processo_numero && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Scale size={10} />{prazo.processo_numero}
                        </span>
                      )}
                      {prazo.cliente_nome && (
                        <span className="text-xs text-gray-400">— {prazo.cliente_nome}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(prazo.data_prazo + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                    {diasLabel(prazo.dias_restantes, prazo.concluido)}
                  </div>
                  {!prazo.concluido && (
                    <button onClick={() => concluir(prazo.id)}
                      className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-green-50 hover:border-green-200 hover:text-green-700 transition-colors">
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NovoPrazoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['prazos'] })}
        />
      )}
    </div>
  );
}
