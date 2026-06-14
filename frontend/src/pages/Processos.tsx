import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { processosService, clientesService } from '../services/clientes';

const TIPO_CORES: Record<string, string> = {
  civel:       'bg-blue-100 text-blue-700',
  bancario:    'bg-purple-100 text-purple-700',
  consumidor:  'bg-green-100 text-green-700',
  trabalhista: 'bg-orange-100 text-orange-700',
  tributario:  'bg-red-100 text-red-700',
};

const STATUS_CORES: Record<string, string> = {
  ativo:     'bg-green-100 text-green-700',
  suspenso:  'bg-yellow-100 text-yellow-700',
  encerrado: 'bg-gray-100 text-gray-600',
};

function NovoProcessoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    cliente_id: '', numero_cnj: '', tipo: 'civel', tribunal: '',
    vara: '', status: 'ativo', valor_causa: '', fase_processual: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: () => clientesService.listar({ limit: 200 }),
  });
  const clientes: Record<string, unknown>[] = clientesData?.data?.data || [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await processosService.criar({
        ...form,
        valor_causa: form.valor_causa ? parseFloat(form.valor_causa) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar processo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">Novo Processo</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cliente *</label>
            <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" required>
              <option value="">Selecione...</option>
              {clientes.map(c => (
                <option key={c.id as string} value={c.id as string}>{c.nome as string}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo *</label>
              <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="civel">Cível</option>
                <option value="bancario">Bancário</option>
                <option value="consumidor">Consumidor</option>
                <option value="trabalhista">Trabalhista</option>
                <option value="tributario">Tributário</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="ativo">Ativo</option>
                <option value="suspenso">Suspenso</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Número CNJ</label>
            <input value={form.numero_cnj} onChange={e => setForm({ ...form, numero_cnj: e.target.value })}
              placeholder="0000000-00.0000.0.00.0000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 font-mono" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tribunal</label>
              <select value={form.tribunal} onChange={e => setForm({ ...form, tribunal: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="">Selecione...</option>
                <option value="TJSP">TJSP</option>
                <option value="TRT15">TRT15</option>
                <option value="STJ">STJ</option>
                <option value="STF">STF</option>
                <option value="TRF3">TRF3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vara</label>
              <input value={form.vara} onChange={e => setForm({ ...form, vara: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Valor da Causa</label>
              <input type="number" value={form.valor_causa} onChange={e => setForm({ ...form, valor_causa: e.target.value })}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fase Processual</label>
              <input value={form.fase_processual} onChange={e => setForm({ ...form, fase_processual: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
          </div>
          {erro && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
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

export default function Processos() {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('ativo');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['processos', filtroTipo, filtroStatus],
    queryFn: () => processosService.listar({
      tipo: filtroTipo || undefined,
      status: filtroStatus || undefined,
    }),
  });

  const processos = ((data?.data?.data || []) as Record<string, unknown>[]).filter(p =>
    !busca ||
    (p.numero_cnj as string)?.includes(busca) ||
    (p.cliente_nome as string)?.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary-800">Processos</h1>
          <p className="text-primary-400 text-sm mt-0.5">{processos.length} processo{processos.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
          <Plus size={16} />
          Novo Processo
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 flex gap-3 flex-wrap border-b border-gray-100">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por número ou cliente..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
          <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
            <option value="">Todos os tipos</option>
            <option value="civel">Cível</option>
            <option value="bancario">Bancário</option>
            <option value="consumidor">Consumidor</option>
            <option value="trabalhista">Trabalhista</option>
            <option value="tributario">Tributário</option>
          </select>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="suspenso">Suspenso</option>
            <option value="encerrado">Encerrado</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : processos.length === 0 ? (
          <div className="p-8 text-center">
            <Scale size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Nenhum processo encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {processos.map(p => (
              <Link key={p.id as string} to={`/processos/${p.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIPO_CORES[p.tipo as string] || 'bg-gray-100 text-gray-600'}`}>
                      {p.tipo as string}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CORES[p.status as string] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status as string}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800">{p.cliente_nome as string}</p>
                  {p.numero_cnj && (
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{p.numero_cnj as string}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  {p.tribunal && <p className="text-xs font-medium text-gray-600">{p.tribunal as string}</p>}
                  {p.vara && <p className="text-xs text-gray-400">{p.vara as string}</p>}
                  {p.valor_causa && (
                    <p className="text-sm font-semibold text-gray-700 mt-1">
                      R$ {Number(p.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NovoProcessoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['processos'] })}
        />
      )}
    </div>
  );
}
