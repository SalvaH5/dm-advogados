import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore(s => s.login);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, senha });
      login(res.data.data.user, res.data.data.token);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao fazer login';
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
         style={{ background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #2C2C2C 100%)' }}>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 py-10 flex flex-col items-center"
             style={{ background: 'linear-gradient(180deg, #111111 0%, #1A1A1A 100%)' }}>
          <div className="mb-4">
            <img src="/logo.png" alt="Dias & Menezes" className="h-16 w-auto object-contain" />
          </div>
          <h1 className="font-display text-white text-2xl font-semibold tracking-wide">
            Dias &amp; Menezes
          </h1>
          <p className="text-primary-300 text-xs tracking-widest uppercase mt-1">
            Advogados Associados
          </p>
        </div>

        {/* Form */}
        <div className="px-8 py-8">
          <p className="text-primary-500 text-sm font-medium mb-6 text-center">
            Acesso ao Sistema de Gestão Jurídica
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                placeholder="seu@diasmenezes.adv.br" required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-primary-600 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                className="w-full border border-primary-200 rounded-lg px-4 py-3 text-sm text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all"
                placeholder="••••••••" required
              />
            </div>

            {erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm">{erro}</p>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary-800 hover:bg-primary-900 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-60 tracking-wide mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 text-center">
          <p className="text-xs text-primary-400">
            R. Amélia Bueno, 110 · Taquaral · Campinas/SP
          </p>
        </div>
      </div>
    </div>
  );
}
