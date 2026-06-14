import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, Mail, Scale, MessageCircle, CheckSquare, Plus, Send, Clock } from 'lucide-react';
import { clientesService, processosService, tarefasService, chatService, historicoService } from '../services/clientes';
import { useAuthStore } from '../store/authStore';

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

const ICONES_HISTORICO: Record<string, string> = {
  tarefa_criada:       '✓',
  nota_adicionada:     '💬',
  processo_aberto:     '⚖️',
  prazo_criado:        '📅',
  documento_enviado:   '📄',
  publicacao_recebida: '📢',
};

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [abaAtiva, setAbaAtiva] = useState<'atividades' | 'processos' | 'tarefas' | 'chat'>('atividades');
  const [novaNota, setNovaNota] = useState('');
  const [novaTarefa, setNovaTarefa] = useState({ titulo: '', data_vencimento: '', prioridade: 'media' });
  const [showTarefaForm, setShowTarefaForm] = useState(false);
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const { data: clienteData } = useQuery({
    queryKey: ['cliente', id],
    queryFn: () => clientesService.buscar(id!),
    enabled: !!id,
  });

  const { data: processosData } = useQuery({
    queryKey: ['processos-cliente', id],
    queryFn: () => processosService.listar({ cliente_id: id, limit: 50 }),
    enabled: !!id,
  });

  const { data: tarefasData } = useQuery({
    queryKey: ['tarefas-cliente', id],
    queryFn: () => tarefasService.listar({ cliente_id: id }),
    enabled: !!id,
  });

  const { data: historicoData } = useQuery({
    queryKey: ['historico-cliente', id],
    queryFn: () => historicoService.porCliente(id!),
    enabled: !!id,
  });

  const { data: chatData } = useQuery({
    queryKey: ['chat-cliente-process', id],
    queryFn: () => {
      const primeiroProcesso = processos[0];
      if (!primeiroProcesso) return Promise.resolve({ data: { data: [] } });
      return chatService.listarPorProcesso(primeiroProcesso.id as string);
    },
    enabled: !!id && abaAtiva === 'chat',
  });

  const cliente = clienteData?.data?.data;
  const processos: Record<string, unknown>[] = processosData?.data?.data || [];
  const tarefas: Record<string, unknown>[] = tarefasData?.data?.data || [];
  const historico: Record<string, unknown>[] = historicoData?.data?.data || [];
  const mensagens: Record<string, unknown>[] = chatData?.data?.data || [];

  async function enviarNota() {
    if (!novaNota.trim()) return;
    await chatService.enviar({ cliente_id: id, conteudo: novaNota, tipo: 'nota' });
    setNovaNota('');
    queryClient.invalidateQueries({ queryKey: ['historico-cliente', id] });
    queryClient.invalidateQueries({ queryKey: ['chat-cliente-process', id] });
  }

  async function criarTarefa() {
    if (!novaTarefa.titulo) return;
    await tarefasService.criar({ ...novaTarefa, cliente_id: id, tipo: 'cliente' });
    setNovaTarefa({ titulo: '', data_vencimento: '', prioridade: 'media' });
    setShowTarefaForm(false);
    queryClient.invalidateQueries({ queryKey: ['tarefas-cliente', id] });
    queryClient.invalidateQueries({ queryKey: ['historico-cliente', id] });
  }

  if (!cliente) return <div className="p-8 text-gray-400 text-sm">Carregando...</div>;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Painel esquerdo */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-5">
          <Link to="/clientes" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4">
            <ArrowLeft size={14} />
            Clientes
          </Link>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-gray-500">
                {(cliente.nome as string)?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="font-semibold text-gray-800 text-base">{cliente.nome as string}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {cliente.tipo_pessoa === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {cliente.email && (
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600 truncate">{cliente.email as string}</span>
              </div>
            )}
            {cliente.telefone && (
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-600">{cliente.telefone as string}</span>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Processos ({processos.length})
            </p>
            <div className="space-y-2">
              {processos.slice(0, 5).map(p => (
                <Link key={p.id as string} to={`/processos/${p.id}`}
                  className="block p-2 rounded-lg hover:bg-gray-50 border border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${TIPO_CORES[p.tipo as string] || 'bg-gray-100 text-gray-600'}`}>
                      {p.tipo as string}
                    </span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${STATUS_CORES[p.status as string] || 'bg-gray-100 text-gray-600'}`}>
                      {p.status as string}
                    </span>
                  </div>
                  {p.numero_cnj && (
                    <p className="text-xs text-gray-500 font-mono truncate">{p.numero_cnj as string}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {cliente.observacoes && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Observações</p>
              <p className="text-xs text-gray-600 leading-relaxed">{cliente.observacoes as string}</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-1">
            {(['atividades', 'processos', 'tarefas', 'chat'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  abaAtiva === aba ? 'bg-primary-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {aba === 'atividades' ? 'Atividades' :
                 aba === 'processos'  ? `Processos (${processos.length})` :
                 aba === 'tarefas'    ? `Tarefas (${tarefas.length})` : 'Notas'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ABA: ATIVIDADES */}
          {abaAtiva === 'atividades' && (
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <textarea value={novaNota} onChange={e => setNovaNota(e.target.value)}
                  placeholder="Adicionar nota ou comentário..."
                  rows={3}
                  className="w-full text-sm text-gray-700 resize-none focus:outline-none" />
                <div className="flex justify-end mt-2">
                  <button onClick={enviarNota} disabled={!novaNota.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-800 text-white text-sm rounded-lg hover:bg-primary-900 disabled:opacity-40">
                    <Send size={14} />
                    Salvar nota
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {historico.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma atividade registrada</p>
                ) : historico.map(h => (
                  <div key={h.id as string} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                      {ICONES_HISTORICO[h.tipo_evento as string] || '•'}
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-sm text-gray-700">{h.descricao as string}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{h.usuario_nome as string}</span>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">
                          {new Date(h.criado_em as string).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA: PROCESSOS */}
          {abaAtiva === 'processos' && (
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                <Link to={`/processos/novo?cliente_id=${id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white text-sm rounded-lg hover:bg-primary-900">
                  <Plus size={14} />
                  Novo processo
                </Link>
              </div>
              {processos.map(p => (
                <Link key={p.id as string} to={`/processos/${p.id}`}
                  className="block bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIPO_CORES[p.tipo as string] || 'bg-gray-100 text-gray-600'}`}>
                          {p.tipo as string}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_CORES[p.status as string] || 'bg-gray-100 text-gray-600'}`}>
                          {p.status as string}
                        </span>
                      </div>
                      {p.numero_cnj && (
                        <p className="text-sm font-mono text-gray-700">{p.numero_cnj as string}</p>
                      )}
                      {p.tribunal && (
                        <p className="text-xs text-gray-400 mt-0.5">{p.tribunal as string}{p.vara ? ` — ${p.vara}` : ''}</p>
                      )}
                    </div>
                    {p.valor_causa && (
                      <p className="text-sm font-semibold text-gray-700">
                        R$ {Number(p.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
              {processos.length === 0 && (
                <div className="text-center py-8">
                  <Scale size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum processo cadastrado</p>
                </div>
              )}
            </div>
          )}

          {/* ABA: TAREFAS */}
          {abaAtiva === 'tarefas' && (
            <div>
              <div className="flex justify-end mb-4">
                <button onClick={() => setShowTarefaForm(!showTarefaForm)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-800 text-white text-sm rounded-lg hover:bg-primary-900">
                  <Plus size={14} />
                  Nova tarefa
                </button>
              </div>
              {showTarefaForm && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                  <div className="space-y-3">
                    <input value={novaTarefa.titulo}
                      onChange={e => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                      placeholder="Título da tarefa"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="date" value={novaTarefa.data_vencimento}
                        onChange={e => setNovaTarefa({ ...novaTarefa, data_vencimento: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400" />
                      <select value={novaTarefa.prioridade}
                        onChange={e => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
                        className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400">
                        <option value="baixa">Baixa</option>
                        <option value="media">Média</option>
                        <option value="alta">Alta</option>
                        <option value="critica">Crítica</option>
                      </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setShowTarefaForm(false)}
                        className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
                        Cancelar
                      </button>
                      <button onClick={criarTarefa}
                        className="px-3 py-1.5 text-sm bg-primary-800 text-white rounded-lg hover:bg-primary-900">
                        Salvar
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {tarefas.map(t => {
                  const diasRestantes = parseInt(t.dias_restantes as string) || 0;
                  return (
                    <div key={t.id as string} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                      <button
                        onClick={() => tarefasService.atualizarStatus(
                          t.id as string,
                          t.status === 'concluida' ? 'a_fazer' : 'concluida'
                        ).then(() => queryClient.invalidateQueries({ queryKey: ['tarefas-cliente', id] }))}
                        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                          t.status === 'concluida' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-500'
                        }`}>
                        {t.status === 'concluida' && <span className="text-white text-xs">✓</span>}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {t.titulo as string}
                        </p>
                        {t.data_vencimento && (
                          <p className={`text-xs mt-0.5 flex items-center gap-1 ${
                            diasRestantes < 0 ? 'text-red-500' : diasRestantes <= 3 ? 'text-orange-500' : 'text-gray-400'
                          }`}>
                            <Clock size={11} />
                            {new Date((t.data_vencimento as string) + 'T12:00:00').toLocaleDateString('pt-BR')}
                            {diasRestantes < 0 ? ` (${Math.abs(diasRestantes)}d atraso)` :
                             diasRestantes === 0 ? ' (hoje)' : ''}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        t.prioridade === 'critica' ? 'bg-red-100 text-red-700' :
                        t.prioridade === 'alta'    ? 'bg-orange-100 text-orange-700' :
                        t.prioridade === 'media'   ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {t.prioridade as string}
                      </span>
                    </div>
                  );
                })}
                {tarefas.length === 0 && (
                  <div className="text-center py-8">
                    <CheckSquare size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">Nenhuma tarefa</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ABA: NOTAS */}
          {abaAtiva === 'chat' && (
            <div>
              <div className="space-y-3 mb-4">
                {mensagens.map(m => (
                  <div key={m.id as string} className={`flex gap-3 ${m.de_usuario_id === user?.id ? 'flex-row-reverse' : ''}`}>
                    <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-gray-500">
                        {(m.de_usuario_nome as string)?.charAt(0)}
                      </span>
                    </div>
                    <div className={`max-w-sm rounded-xl px-4 py-2.5 ${
                      m.de_usuario_id === user?.id
                        ? 'bg-primary-800 text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}>
                      <p className="text-sm">{m.conteudo as string}</p>
                      <p className={`text-xs mt-1 ${m.de_usuario_id === user?.id ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(m.criado_em as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                {mensagens.length === 0 && (
                  <div className="text-center py-8">
                    <MessageCircle size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-400 text-sm">Nenhuma nota registrada</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <input value={novaNota} onChange={e => setNovaNota(e.target.value)}
                  placeholder="Escrever nota..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                  onKeyDown={e => e.key === 'Enter' && enviarNota()} />
                <button onClick={enviarNota} disabled={!novaNota.trim()}
                  className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900 disabled:opacity-40">
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
