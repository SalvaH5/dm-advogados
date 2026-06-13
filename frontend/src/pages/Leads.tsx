import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, User, Phone, Mail, TrendingUp } from 'lucide-react';
import { leadsService } from '../services/clientes';

const COLUNAS = [
  { key: 'primeiro_contato', label: 'Primeiro Contato', color: 'bg-gray-100 text-gray-600' },
  { key: 'consulta',         label: 'Consulta',         color: 'bg-blue-50 text-blue-600' },
  { key: 'proposta',         label: 'Proposta',         color: 'bg-yellow-50 text-yellow-700' },
  { key: 'fechado',          label: 'Fechado',          color: 'bg-green-50 text-green-700' },
  { key: 'perdido',          label: 'Perdido',          color: 'bg-red-50 text-red-600' },
];

interface Lead {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  area_interesse?: string;
  origem?: string;
  status_pipeline: string;
  criado_em: string;
}

function NovoLeadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', area_interesse: '', origem: 'direto', observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await leadsService.criar(form);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar lead');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Novo Lead</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome *</label>
              <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Telefone</label>
              <input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Área de interesse</label>
              <input value={form.area_interesse} onChange={e => setForm({ ...form, area_interesse: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Origem</label>
              <select value={form.origem} onChange={e => setForm({ ...form, origem: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="direto">Contato direto</option>
                <option value="indicacao">Indicação</option>
                <option value="site">Site</option>
                <option value="instagram">Instagram</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })}
                rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
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

function LeadCard({ lead, onStatusChange }: { lead: Lead; onStatusChange: () => void }) {
  async function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    try {
      await leadsService.atualizarStatus(lead.id, { status_pipeline: e.target.value });
      onStatusChange();
    } catch {
      // silent
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-2 mb-2">
        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-gray-600 font-semibold text-xs">
            {lead.nome.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-800 text-sm truncate">{lead.nome}</p>
          {lead.area_interesse && (
            <p className="text-xs text-gray-400 truncate">{lead.area_interesse}</p>
          )}
        </div>
      </div>
      <div className="space-y-1 mb-3">
        {lead.email && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Mail size={10} />{lead.email}
          </span>
        )}
        {lead.telefone && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Phone size={10} />{lead.telefone}
          </span>
        )}
      </div>
      <select
        value={lead.status_pipeline}
        onChange={handleStatusChange}
        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-gray-50"
      >
        {COLUNAS.map(c => (
          <option key={c.key} value={c.key}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function Leads() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: () => leadsService.kanban(),
  });

  const kanban: Record<string, Lead[]> = data?.data?.data || {};

  const totalLeads = Object.values(kanban).reduce((sum, col) => sum + col.length, 0);

  function refresh() {
    queryClient.invalidateQueries({ queryKey: ['leads-kanban'] });
  }

  return (
    <div className="p-8 max-w-full mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary-800">Leads</h1>
          <p className="text-primary-400 text-sm mt-0.5">{totalLeads} lead{totalLeads !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
          <Plus size={16} />
          Novo Lead
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {COLUNAS.map(col => {
            const leads = kanban[col.key] || [];
            return (
              <div key={col.key} className="flex-shrink-0 w-64 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">{leads.length}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {leads.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg border border-dashed border-gray-200 p-4 text-center">
                      <TrendingUp size={20} className="mx-auto text-gray-300 mb-1" />
                      <p className="text-xs text-gray-400">Sem leads</p>
                    </div>
                  ) : (
                    leads.map((lead: Lead) => (
                      <LeadCard key={lead.id} lead={lead} onStatusChange={refresh} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <NovoLeadModal
          onClose={() => setShowModal(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
