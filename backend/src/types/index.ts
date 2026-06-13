import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissoes: Record<string, Record<string, boolean>>;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CamposCivel {
  valor_causa?: number;
  pedido_principal?: string;
  reu_nome?: string;
  reu_cpf_cnpj?: string;
  natureza_acao?: string;
  tem_liminar?: boolean;
  valor_liminar?: number;
}

export interface CamposBancario {
  instituicao_financeira?: string;
  numero_contrato?: string;
  modalidade?: string;
  valor_contestado?: number;
  taxa_juros_contratada?: number;
  periodo_contrato?: string;
}

export interface CamposConsumidor {
  empresa_re?: string;
  cnpj_empresa?: string;
  produto_servico?: string;
  tipo_dano?: string;
  valor_dano_material?: number;
  valor_pleiteado_moral?: number;
}

export interface CamposTrabalhista {
  nome_empregador?: string;
  cnpj_empregador?: string;
  data_admissao?: string;
  data_demissao?: string;
  cargo?: string;
  salario_rescisao?: number;
  verbas_pleiteadas?: string[];
  tipo?: string;
}

export interface CamposTributario {
  tributo?: string;
  esfera?: string;
  periodo_apuracao?: string;
  valor_debito_principal?: number;
  multa?: number;
  juros?: number;
  situacao?: string;
}
