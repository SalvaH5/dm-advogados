import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Calendar, Clock, Send, FileText } from 'lucide-react';
import { processosService, prazosService, tarefasService, chatService, historicoService } from '../services/clientes';
import { useAuthStore } from '../store/authStore';

const TIPO_CORES: Record<string, string> = {
  civel:       'bg-blue-100 text-blue-700',
  bancario:    'bg-purple-100 text-purple-700',
  consumidor:  'bg-green-100 text-green-700',
  trabalhista: 'bg-orange-100 text-orange-700',
  tributario:  'bg-red-100 text-red-700',
};

export default function ProcessoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [abaAtiva, setAbaAtiva] = useState<'atividades' | 'prazos' | 'tarefas' | 'chat'>('atividades');
  const [novaNota, setNovaNota] = useState('');
  const user = useAuthStore(s => s.user);
  const queryClient = useQueryClient();

  const { data: processoData } = useQuery({
    queryKey: ['processo', id],
    queryFn: () => processosService.buscar(id!),
    enabled: !!id,
  });

  const { data: prazosData } = useQuery({
    queryKey: ['prazos-processo', id],
    queryFn: () => prazosService.listar({ processo_id: id }),
    enabled: !!id,
  });

  const { data: tarefasData } = useQuery({
    queryKey: ['tarefas-processo', id],
    queryFn: () => tarefasService.listar({ processo_id: id }),
    enabled: !!id,
  });

  const { data: chatData } = useQuery({
    queryKey: ['chat-processo', id],
    queryFn: () => chatService.listarPorProcesso(id!),
    enabled: !!id && abaAtiva === 'chat',
  });

  const { data: historicoData } = useQuery({
    queryKey: ['historico-processo', id],
    queryFn: () => historicoService.porProcesso(id!),
    enabled: !!id,
  });

  const processo = processoData?.data?.data;
  const prazos: Record<string, unknown>[] = prazosData?.data?.data || [];
  const tarefas: Record<string, unknown>[] = tarefasData?.data?.data || [];
  const mensagens: Record<string, unknown>[] = chatData?.data?.data || [];
  const historico: Record<string, unknown>[] = historicoData?.data?.data || [];

  async function enviarNota() {
    if (!novaNota.trim()) return;
    await chatService.enviar({ processo_id: id, conteudo: novaNota, tipo: 'nota' });
    setNovaNota('');
    queryClient.invalidateQueries({ queryKey: ['chat-processo', id] });
    queryClient.invalidateQueries({ queryKey: ['historico-processo', id] });
  }

  if (!processo) return <div className="p-8 text-gray-400 text-sm">Carregando...</div>;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Painel esquerdo */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="p-5">
          <Link to="/processos" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 mb-4">
            <ArrowLeft size={14} />
            Processos
          </Link>

          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TIPO_CORES[processo.tipo] || 'bg-gray-100 text-gray-600'}`}>
                {processo.tipo}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 capitalize">
                {processo.status}
              </span>
            </div>
            {processo.numero_cnj && (
              <p className="text-sm font-mono text-gray-700 font-semibold break-all">{processo.numero_cnj}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              <Link to={`/clientes/${processo.cliente_id}`} className="hover:text-primary-600">
                {processo.cliente_nome}
              </Link>
            </p>
          </div>

          <div className="space-y-4 text-sm">
            {processo.tribunal && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Tribunal</p>
                <p className="text-gray-700">{processo.tribunal}</p>
              </div>
            )}
            {processo.vara && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Vara</p>
                <p className="text-gray-700">{processo.vara}</p>
              </div>
            )}
            {processo.valor_causa && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Valor da Causa</p>
                <p className="text-gray-700 font-semibold">
                  R$ {Number(processo.valor_causa).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
            {processo.fase_processual && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">Fase</p>
                <p className="text-gray-700">{processo.fase_processual}</p>
              </div>
            )}
          </div>

          {processo.vara_observacoes && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Perfil da Vara</p>
              {processo.juiz_atual && (
                <p className="text-xs text-gray-600 mb-1"><span className="font-medium">Juiz:</span> {processo.juiz_atual}</p>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">{processo.vara_observacoes}</p>
            </div>
          )}

          {processo.resumo_ia && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumo IA</p>
              <p className="text-xs text-gray-600 leading-relaxed">{processo.resumo_ia}</p>
            </div>
          )}
        </div>
      </div>

      {/* Painel direito */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-1">
            {(['atividades', 'prazos', 'tarefas', 'chat'] as const).map(aba => (
              <button key={aba} onClick={() => setAbaAtiva(aba)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  abaAtiva === aba ? 'bg-primary-800 text-white' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                {aba === 'atividades' ? 'Atividades' :
                 aba === 'prazos'     ? `Prazos (${prazos.length})` :
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
                  placeholder="Registrar andamento, observação ou nota..."
                  rows={3}
                  className="w-full text-sm text-gray-700 resize-none focus:outline-none" />
                <div className="flex justify-end mt-2">
                  <button onClick={enviarNota} disabled={!novaNota.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary-800 text-white text-sm rounded-lg hover:bg-primary-900 disabled:opacity-40">
                    <Send size={14} />
                    Registrar
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {historico.map(h => (
                  <div key={h.id as string} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                      •
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-gray-200 p-3">
                      <p className="text-sm text-gray-700">{h.descricao as string}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400">{h.usuario_nome as string}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(h.criado_em as string).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {historico.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma atividade registrada</p>
                )}
              </div>
            </div>
          )}

          {/* ABA: PRAZOS */}
          {abaAtiva === 'prazos' && (
            <div className="space-y-3">
              {prazos.map(p => {
                const diasRestantes = parseInt(p.dias_restantes as string) || 0;
                return (
                  <div key={p.id as string} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      diasRestantes < 0  ? 'bg-red-50 text-red-600' :
                      diasRestantes <= 3 ? 'bg-orange-50 text-orange-600' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      <Clock size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{p.titulo as string}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date((p.data_prazo as string) + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {diasRestantes < 0 ? ` — ${Math.abs(diasRestantes)}d atraso` :
                         diasRestantes === 0 ? ' — hoje' : ` — ${diasRestantes}d restantes`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.concluido ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.concluido ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                );
              })}
              {prazos.length === 0 && (
                <div className="text-center py-8">
                  <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Nenhum prazo cadastrado</p>
                </div>
              )}
            </div>
          )}

          {/* ABA: TAREFAS */}
          {abaAtiva === 'tarefas' && (
            <div className="space-y-2">
              {tarefas.map(t => (
                <div key={t.id as string} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <button onClick={() => tarefasService.atualizarStatus(
                    t.id as string,
                    t.status === 'concluida' ? 'a_fazer' : 'concluida'
                  ).then(() => queryClient.invalidateQueries({ queryKey: ['tarefas-processo', id] }))}
                    className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                      t.status === 'concluida' ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-500'
                    }`}>
                    {t.status === 'concluida' && <span className="text-white text-xs">✓</span>}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${t.status === 'concluida' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {t.titulo as string}
                    </p>
                    {t.data_vencimento && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date((t.data_vencimento as string) + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.prioridade === 'critica' ? 'bg-red-100 text-red-700' :
                    t.prioridade === 'alta'    ? 'bg-orange-100 text-orange-700' :
                    t.prioridade === 'media'   ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {t.prioridade as string}
                  </span>
                </div>
              ))}
              {tarefas.length === 0 && (
                <div className="text-center py-8">
                  <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-400 text-sm">Nenhuma tarefa</p>
                </div>
              )}
            </div>
          )}

          {/* ABA: NOTAS/CHAT */}
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
                    </div>
                  </div>
                ))}
                {mensagens.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Nenhuma nota registrada</p>
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
