import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { agendaService } from '../services/clientes';

const TIPOS: Record<string, { label: string; cor: string }> = {
  audiencia: { label: 'Audiência', cor: 'bg-red-100 text-red-700 border-red-200' },
  reuniao:   { label: 'Reunião',   cor: 'bg-blue-100 text-blue-700 border-blue-200' },
  prazo:     { label: 'Prazo',     cor: 'bg-orange-100 text-orange-700 border-orange-200' },
  consulta:  { label: 'Consulta',  cor: 'bg-green-100 text-green-700 border-green-200' },
  outro:     { label: 'Outro',     cor: 'bg-gray-100 text-gray-700 border-gray-200' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function NovoEventoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    titulo: '', tipo: 'reuniao', data_inicio: '', data_fim: '', local: '', descricao: ''
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await agendaService.criar(form);
      onSuccess();
      onClose();
    } catch { /* */ }
    finally { setLoading(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Novo Evento</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Título *</label>
            <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" required />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
              {Object.entries(TIPOS).map(([k, { label }]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Início *</label>
              <input type="datetime-local" value={form.data_inicio}
                onChange={e => setForm({ ...form, data_inicio: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Fim</label>
              <input type="datetime-local" value={form.data_fim}
                onChange={e => setForm({ ...form, data_fim: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Local</label>
            <input value={form.local} onChange={e => setForm({ ...form, local: e.target.value })}
              placeholder="Ex: Fórum de Campinas, Sala 12"
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

export default function Agenda() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth());
  const [ano, setAno] = useState(hoje.getFullYear());
  const [view, setView] = useState<'mes' | 'agenda'>('mes');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['agenda', mes + 1, ano],
    queryFn: () => agendaService.listar({ mes: mes + 1, ano }),
  });

  const eventos: Record<string, unknown>[] = data?.data?.data || [];

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const iniciaSemana = primeiroDia.getDay();

  const dias: (number | null)[] = [];
  for (let i = 0; i < iniciaSemana; i++) dias.push(null);
  for (let i = 1; i <= diasNoMes; i++) dias.push(i);

  function eventosNoDia(dia: number) {
    return eventos.filter(e => {
      const d = new Date(e.data_inicio as string);
      return d.getDate() === dia && d.getMonth() === mes && d.getFullYear() === ano;
    });
  }

  function navMes(delta: number) {
    const d = new Date(ano, mes + delta, 1);
    setMes(d.getMonth());
    setAno(d.getFullYear());
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-semibold text-primary-800">Agenda</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['mes', 'agenda'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  view === v ? 'bg-white shadow text-gray-800' : 'text-gray-500'
                }`}>
                {v === 'mes' ? 'Mês' : 'Agenda'}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
            <Plus size={16} />
            Novo Evento
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => navMes(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 min-w-48 text-center">
          {MESES[mes]} {ano}
        </h2>
        <button onClick={() => navMes(1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={18} />
        </button>
        <button onClick={() => { setMes(hoje.getMonth()); setAno(hoje.getFullYear()); }}
          className="ml-2 px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          Hoje
        </button>
      </div>

      {view === 'mes' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DIAS_SEMANA.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {dias.map((dia, idx) => {
              const isHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
              const evsDia = dia ? eventosNoDia(dia) : [];
              return (
                <div key={idx}
                  className={`min-h-24 p-1.5 border-b border-r border-gray-100 ${!dia ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  {dia && (
                    <>
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1 ${
                        isHoje ? 'bg-primary-800 text-white font-bold' : 'text-gray-700'
                      }`}>
                        {dia}
                      </div>
                      <div className="space-y-0.5">
                        {evsDia.slice(0, 3).map(ev => (
                          <div key={ev.id as string}
                            className={`text-xs px-1.5 py-0.5 rounded truncate border ${TIPOS[ev.tipo as string]?.cor || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {new Date(ev.data_inicio as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {ev.titulo as string}
                          </div>
                        ))}
                        {evsDia.length > 3 && (
                          <p className="text-xs text-gray-400 px-1">+{evsDia.length - 3} mais</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'agenda' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {eventos.length === 0 ? (
            <div className="p-8 text-center">
              <Clock size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">Nenhum evento este mês</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {eventos.map(ev => (
                <div key={ev.id as string} className="p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 text-center w-14">
                    <p className="text-2xl font-bold text-primary-800">
                      {new Date(ev.data_inicio as string).getDate()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {DIAS_SEMANA[new Date(ev.data_inicio as string).getDay()]}
                    </p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${TIPOS[ev.tipo as string]?.cor || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {TIPOS[ev.tipo as string]?.label || (ev.tipo as string)}
                      </span>
                    </div>
                    <p className="font-medium text-gray-800 text-sm">{ev.titulo as string}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                      <span>
                        {new Date(ev.data_inicio as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        {ev.data_fim && ` — ${new Date(ev.data_fim as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                      {ev.local && <span>• {ev.local as string}</span>}
                      {ev.cliente_nome && <span>• {ev.cliente_nome as string}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <NovoEventoModal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['agenda'] })}
        />
      )}
    </div>
  );
}
