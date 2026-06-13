import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, User, Phone, Mail, Scale } from 'lucide-react';
import { clientesService } from '../services/clientes';

function Modal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    nome: '', cpf_cnpj: '', tipo_pessoa: 'fisica', email: '',
    telefone: '', whatsapp: '', profissao: '', estado_civil: '', observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await clientesService.criar(form);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErro((err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Novo Cliente</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome completo *</label>
              <input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
              <select value={form.tipo_pessoa} onChange={e => setForm({...form, tipo_pessoa: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                <option value="fisica">Pessoa Física</option>
                <option value="juridica">Pessoa Jurídica</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">CPF/CNPJ</label>
              <input value={form.cpf_cnpj} onChange={e => setForm({...form, cpf_cnpj: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Telefone</label>
              <input value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">WhatsApp</label>
              <input value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Observações</label>
              <textarea value={form.observacoes} onChange={e => setForm({...form, observacoes: e.target.value})}
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

export default function Clientes() {
  const [busca, setBusca] = useState('');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', busca],
    queryFn: () => clientesService.listar({ q: busca || undefined }),
  });

  const clientes = data?.data?.data || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary-800">Clientes</h1>
          <p className="text-primary-400 text-sm mt-0.5">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-900">
          <Plus size={16} />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={busca} onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400" />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Carregando...</div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center">
            <User size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-400 text-sm">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {clientes.map((cliente: Record<string, unknown>) => (
              <div key={cliente.id as string} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-semibold text-sm">
                      {(cliente.nome as string).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{cliente.nome as string}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {cliente.email && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Mail size={11} />{cliente.email as string}
                        </span>
                      )}
                      {cliente.telefone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={11} />{cliente.telefone as string}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {(cliente.total_processos as number) > 0 && (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    <Scale size={11} />{cliente.total_processos as number} processo{(cliente.total_processos as number) !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['clientes'] })}
        />
      )}
    </div>
  );
}
