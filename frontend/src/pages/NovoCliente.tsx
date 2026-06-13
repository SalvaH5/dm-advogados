import { useState } from 'react';

export default function NovoCliente() {
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', area_interesse: '', mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/publico/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          area_interesse: form.area_interesse,
          observacoes: form.mensagem,
          origem: 'site',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || 'Erro ao enviar');
      }
      setSucesso(true);
    } catch (err: unknown) {
      setErro((err as Error).message || 'Erro ao enviar solicitação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-base tracking-tight">DM</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-gray-900">Dias &amp; Menezes</h1>
          <p className="text-gray-500 text-sm mt-1">Advogados Associados</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {sucesso ? (
            <div className="p-8 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-semibold text-gray-800 text-lg mb-2">Solicitação enviada!</h2>
              <p className="text-gray-500 text-sm">
                Recebemos seu contato e entraremos em breve para agendar uma consulta.
              </p>
            </div>
          ) : (
            <>
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="font-semibold text-gray-800">Solicitar Consulta</h2>
                <p className="text-gray-500 text-xs mt-0.5">Preencha o formulário e entraremos em contato</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nome completo *</label>
                  <input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                    required />
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Área de interesse</label>
                  <select value={form.area_interesse} onChange={e => setForm({ ...form, area_interesse: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                    <option value="">Selecione...</option>
                    <option value="Direito Cível">Direito Cível</option>
                    <option value="Direito Trabalhista">Direito Trabalhista</option>
                    <option value="Direito do Consumidor">Direito do Consumidor</option>
                    <option value="Direito Bancário">Direito Bancário</option>
                    <option value="Direito Tributário">Direito Tributário</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Mensagem</label>
                  <textarea value={form.mensagem} onChange={e => setForm({ ...form, mensagem: e.target.value })}
                    rows={4} placeholder="Descreva brevemente sua situação..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none" />
                </div>
                {erro && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{erro}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  {loading ? 'Enviando...' : 'Enviar solicitação'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Dias &amp; Menezes Advogados Associados
        </p>
      </div>
    </div>
  );
}
