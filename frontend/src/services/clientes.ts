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
