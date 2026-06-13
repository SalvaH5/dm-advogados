-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ─────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  senha_hash    VARCHAR(255) NOT NULL,
  role          VARCHAR(50) NOT NULL DEFAULT 'advogado', -- admin | advogado | assistente
  permissoes    JSONB NOT NULL DEFAULT '{}',
  oab_numero    VARCHAR(50),
  oab_estado    VARCHAR(2),
  ativo         BOOLEAN NOT NULL DEFAULT true,
  criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AUDITORIA
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auditoria (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  acao          VARCHAR(100) NOT NULL, -- create | update | delete | login | logout
  tabela        VARCHAR(100),
  registro_id   UUID,
  dados         JSONB,
  ip            VARCHAR(50),
  criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CLIENTES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome            VARCHAR(255) NOT NULL,
  cpf_cnpj        BYTEA, -- criptografado com pgcrypto
  cpf_cnpj_hash   VARCHAR(64), -- SHA256 para busca sem descriptografar
  tipo_pessoa     VARCHAR(10) NOT NULL DEFAULT 'fisica', -- fisica | juridica
  email           VARCHAR(255),
  telefone        VARCHAR(30),
  whatsapp        VARCHAR(30),
  endereco        JSONB, -- { logradouro, numero, complemento, bairro, cidade, estado, cep }
  data_nascimento DATE,
  profissao       VARCHAR(100),
  estado_civil    VARCHAR(30),
  observacoes     TEXT,
  origem_lead_id  UUID, -- FK para leads (Fase 2)
  ativo           BOOLEAN NOT NULL DEFAULT true,
  criado_por      UUID REFERENCES users(id),
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROCESSOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processos (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id            UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero_cnj            VARCHAR(50),
  tipo                  VARCHAR(50) NOT NULL, -- civel | bancario | consumidor | trabalhista | tributario
  tribunal              VARCHAR(100),
  vara                  VARCHAR(100),
  comarca               VARCHAR(100),
  status                VARCHAR(50) NOT NULL DEFAULT 'ativo', -- ativo | suspenso | encerrado | arquivado
  fase_processual       VARCHAR(100),
  data_distribuicao     DATE,
  valor_causa           DECIMAL(15,2),
  polo_ativo            VARCHAR(255), -- nome do autor
  polo_passivo          VARCHAR(255), -- nome do réu
  -- Campos específicos por tipo (JSONB flexível)
  campos_especificos    JSONB NOT NULL DEFAULT '{}',
  -- IA
  resumo_ia             TEXT,
  sugestao_ia           TEXT,
  -- Resultado
  resultado_final       VARCHAR(50), -- procedente | parcial | improcedente | acordo | arquivado
  resultado_observacoes TEXT,
  encerrado_em          DATE,
  -- Controle
  advogado_responsavel  UUID REFERENCES users(id),
  criado_por            UUID REFERENCES users(id),
  criado_em             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resultados parciais do processo
CREATE TABLE IF NOT EXISTS processo_resultados (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id      UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  tipo             VARCHAR(20) NOT NULL DEFAULT 'parcial', -- parcial | final
  subtipo          VARCHAR(50), -- liminar_concedida | liminar_negada | recurso_provido | recurso_negado | sentenca | acordao | acordo_parcial
  descricao        TEXT,
  data_resultado   DATE NOT NULL,
  fase_processual  VARCHAR(100),
  criado_por       UUID REFERENCES users(id),
  criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PERFIS DE VARAS E JUÍZES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS perfis_vara (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tribunal     VARCHAR(100) NOT NULL,
  vara         VARCHAR(100) NOT NULL,
  comarca      VARCHAR(100),
  juiz_atual   VARCHAR(255),
  observacoes  TEXT,
  tendencias   JSONB DEFAULT '{}', -- { "liminar": "restritivo", "dano_moral": "conservador" }
  usuario_id   UUID REFERENCES users(id),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_em    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tribunal, vara)
);

-- ─────────────────────────────────────────
-- TEMPLATES VERSIONADOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome          VARCHAR(255) NOT NULL,
  tipo          VARCHAR(50) NOT NULL, -- procuracao | contrato | declaracao | outro
  variacao      VARCHAR(100), -- civel | trabalhista | criminal | previdenciario | fixo | exito | misto
  conteudo      TEXT NOT NULL, -- texto com placeholders {{nome_cliente}}, {{cpf}}, etc.
  variaveis     JSONB NOT NULL DEFAULT '[]', -- lista de placeholders disponíveis
  versao        INTEGER NOT NULL DEFAULT 1,
  ativo         BOOLEAN NOT NULL DEFAULT true,
  alterado_por  UUID REFERENCES users(id),
  alterado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criado_por    UUID REFERENCES users(id),
  criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Histórico de versões dos templates
CREATE TABLE IF NOT EXISTS templates_historico (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id  UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  versao       INTEGER NOT NULL,
  conteudo     TEXT NOT NULL,
  alterado_por UUID REFERENCES users(id),
  alterado_em  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- DOCUMENTOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id     UUID REFERENCES processos(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE CASCADE,
  nome            VARCHAR(255) NOT NULL,
  tipo            VARCHAR(100), -- procuracao | contrato | declaracao | peticao | outros
  caminho_spaces  VARCHAR(500) NOT NULL, -- path no DO Spaces
  url_publica     VARCHAR(500), -- URL temporária assinada
  tamanho_bytes   BIGINT,
  mime_type       VARCHAR(100),
  visivel_portal  BOOLEAN NOT NULL DEFAULT false,
  enviado_por     VARCHAR(20) NOT NULL DEFAULT 'advogado', -- advogado | cliente
  revisado_por    UUID REFERENCES users(id),
  revisado_em     TIMESTAMP WITH TIME ZONE,
  -- ZapSign
  zapsign_doc_token   VARCHAR(255),
  zapsign_status      VARCHAR(50), -- pending | signed | refused | cancelled
  zapsign_signed_url  VARCHAR(500),
  criado_por      UUID REFERENCES users(id),
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ONBOARDING
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS onboardings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  processo_id     UUID REFERENCES processos(id),
  status          VARCHAR(50) NOT NULL DEFAULT 'pendente', -- pendente | documentos_gerados | aguardando_assinatura | concluido | cancelado
  templates_usados JSONB NOT NULL DEFAULT '[]', -- IDs dos templates gerados
  zapsign_envelope_id VARCHAR(255),
  checklist       JSONB NOT NULL DEFAULT '{}',
  portal_liberado BOOLEAN NOT NULL DEFAULT false,
  criado_por      UUID REFERENCES users(id),
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PORTAL DO CLIENTE — tokens
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expira_em   TIMESTAMP WITH TIME ZONE NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clientes_cpf_hash ON clientes(cpf_cnpj_hash);
CREATE INDEX IF NOT EXISTS idx_processos_cliente ON processos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_processos_numero_cnj ON processos(numero_cnj);
CREATE INDEX IF NOT EXISTS idx_processos_tipo ON processos(tipo);
CREATE INDEX IF NOT EXISTS idx_documentos_processo ON documentos(processo_id);
CREATE INDEX IF NOT EXISTS idx_documentos_cliente ON documentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_tabela ON auditoria(tabela, registro_id);
CREATE INDEX IF NOT EXISTS idx_perfis_vara_tribunal ON perfis_vara(tribunal, vara);
CREATE INDEX IF NOT EXISTS idx_portal_tokens_hash ON portal_tokens(token_hash);

-- ─────────────────────────────────────────
-- DADOS INICIAIS
-- ─────────────────────────────────────────
-- Usuário admin padrão (senha: DmAdmin2025! — trocar no primeiro acesso)
INSERT INTO users (nome, email, senha_hash, role, permissoes)
VALUES (
  'Administrador',
  'admin@diasmenezes.adv.br',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGAtXFpS1qO0gTcq/cK7W3jqOlS',
  'admin',
  '{
    "clientes": {"ler": true, "criar": true, "editar": true, "deletar": true},
    "processos": {"ler": true, "criar": true, "editar": true, "deletar": true},
    "documentos": {"ler": true, "criar": true, "editar": true, "deletar": true},
    "templates": {"ler": true, "criar": true, "editar": true, "deletar": true},
    "financeiro": {"ler": true, "criar": true, "editar": true},
    "usuarios": {"ler": true, "criar": true, "editar": true},
    "auditoria": {"ler": true}
  }'::jsonb
) ON CONFLICT (email) DO NOTHING;
