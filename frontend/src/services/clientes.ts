import api from './api';

export const clientesService = {
  listar: (params?: Record<string, unknown>) => api.get('/clientes', { params }),
  buscar: (id: string) => api.get(`/clientes/${id}`),
  criar: (data: Record<string, unknown>) => api.post('/clientes', data),
  atualizar: (id: string, data: Record<string, unknown>) => api.put(`/clientes/${id}`, data),
  ocrCnh: (formData: FormData) => api.post('/clientes/ocr-cnh', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const processosService = {
  listar: (params?: Record<string, unknown>) => api.get('/processos', { params }),
  buscar: (id: string) => api.get(`/processos/${id}`),
  criar: (data: Record<string, unknown>) => api.post('/processos', data),
  atualizar: (id: string, data: Record<string, unknown>) => api.put(`/processos/${id}`, data),
  adicionarResultado: (id: string, data: Record<string, unknown>) => api.post(`/processos/${id}/resultado`, data),
};

export const prazosService = {
  listar: (params?: Record<string, unknown>) => api.get('/prazos', { params }),
  criar: (data: Record<string, unknown>) => api.post('/prazos', data),
  concluir: (id: string) => api.put(`/prazos/${id}/concluir`, {}),
  calcular: (data: Record<string, unknown>) => api.post('/prazos/calcular', data),
  vencendoHoje: () => api.get('/prazos/vencendo-hoje'),
};

export const publicacoesService = {
  listar: (params?: Record<string, unknown>) => api.get('/publicacoes', { params }),
  criar: (data: Record<string, unknown>) => api.post('/publicacoes', data),
  marcarLida: (id: string) => api.put(`/publicacoes/${id}/lida`, {}),
  naoLidas: () => api.get('/publicacoes/nao-lidas'),
};

export const leadsService = {
  listar: (params?: Record<string, unknown>) => api.get('/leads', { params }),
  kanban: () => api.get('/leads/kanban'),
  criar: (data: Record<string, unknown>) => api.post('/leads', data),
  atualizarStatus: (id: string, data: Record<string, unknown>) => api.put(`/leads/${id}/status`, data),
  adicionarInteracao: (id: string, data: Record<string, unknown>) => api.post(`/leads/${id}/interacoes`, data),
  converter: (id: string) => api.post(`/leads/${id}/converter`, {}),
};

export const dashboardService = {
  stats: () => api.get('/dashboard/stats'),
};

export const tarefasService = {
  listar: (params?: Record<string, unknown>) => api.get('/tarefas', { params }),
  kanban: (params?: Record<string, unknown>) => api.get('/tarefas/kanban', { params }),
  criar: (data: Record<string, unknown>) => api.post('/tarefas', data),
  atualizar: (id: string, data: Record<string, unknown>) => api.put(`/tarefas/${id}`, data),
  atualizarStatus: (id: string, status: string) => api.put(`/tarefas/${id}/status`, { status }),
};

export const agendaService = {
  listar: (params?: Record<string, unknown>) => api.get('/agenda', { params }),
  proximos: () => api.get('/agenda/proximos'),
  criar: (data: Record<string, unknown>) => api.post('/agenda', data),
  atualizar: (id: string, data: Record<string, unknown>) => api.put(`/agenda/${id}`, data),
  deletar: (id: string) => api.delete(`/agenda/${id}`),
};

export const chatService = {
  listarPorProcesso: (processoId: string) => api.get(`/chat/processo/${processoId}`),
  enviar: (data: Record<string, unknown>) => api.post('/chat', data),
};

export const historicoService = {
  porCliente: (clienteId: string) => api.get(`/historico/cliente/${clienteId}`),
  porProcesso: (processoId: string) => api.get(`/historico/processo/${processoId}`),
  registrar: (data: Record<string, unknown>) => api.post('/historico', data),
};
