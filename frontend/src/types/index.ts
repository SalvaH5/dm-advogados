export interface User {
  id: string;
  nome: string;
  email: string;
  role: string;
  permissoes: Record<string, Record<string, boolean>>;
}

export interface Cliente {
  id: string;
  nome: string;
  cpf_cnpj?: string;
  tipo_pessoa: 'fisica' | 'juridica';
  email?: string;
  telefone?: string;
  whatsapp?: string;
  total_processos?: number;
  criado_em: string;
}

export interface Processo {
  id: string;
  cliente_id: string;
  cliente_nome?: string;
  numero_cnj?: string;
  tipo: 'civel' | 'bancario' | 'consumidor' | 'trabalhista' | 'tributario';
  tribunal?: string;
  vara?: string;
  status: string;
  valor_causa?: number;
  campos_especificos?: Record<string, unknown>;
  resumo_ia?: string;
  criado_em: string;
}

export interface Template {
  id: string;
  nome: string;
  tipo: string;
  variacao?: string;
  conteudo: string;
  variaveis: string[];
  versao: number;
  ativo: boolean;
  alterado_em: string;
}

export interface Documento {
  id: string;
  nome: string;
  tipo: string;
  tamanho_bytes: number;
  visivel_portal: boolean;
  enviado_por: string;
  criado_em: string;
}
