-- ─────────────────────────────────────────
-- PRAZOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prazos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id      UUID NOT NULL REFERENCES processos(id) ON DELETE CASCADE,
  usuario_id       UUID REFERENCES users(id),
  titulo           VARCHAR(255) NOT NULL,
  descricao        TEXT,
  data_prazo       DATE NOT NULL,
  data_intimacao   DATE,
  tipo             VARCHAR(50) DEFAULT 'processual', -- processual | audiencia | reuniao | outro
  prioridade       VARCHAR(20) DEFAULT 'media', -- baixa | media | alta | critica
  concluido        BOOLEAN NOT NULL DEFAULT false,
  concluido_em     TIMESTAMP WITH TIME ZONE,
  dias_uteis       BOOLEAN NOT NULL DEFAULT true,
  alertas_enviados JSONB DEFAULT '[]',
  criado_por       UUID REFERENCES users(id),
  criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PUBLICAÇÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS publicacoes (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id      UUID REFERENCES processos(id) ON DELETE SET NULL,
  numero_cnj       VARCHAR(50),
  fonte            VARCHAR(50) NOT NULL DEFAULT 'manual', -- datajud | email | escavador | manual
  tribunal         VARCHAR(50),
  tipo_ato         VARCHAR(100),
  conteudo         TEXT NOT NULL,
  resumo_ia        TEXT,
  data_publicacao  DATE,
  prazo_dias       INTEGER,
  prazo_data       DATE,
  lida             BOOLEAN NOT NULL DEFAULT false,
  requer_resposta  BOOLEAN NOT NULL DEFAULT false,
  tarefa_criada    BOOLEAN NOT NULL DEFAULT false,
  criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LEADS / CRM
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome                  VARCHAR(255) NOT NULL,
  email                 VARCHAR(255),
  telefone              VARCHAR(30),
  whatsapp              VARCHAR(30),
  origem                VARCHAR(50) DEFAULT 'site', -- site | whatsapp | indicacao | redes_sociais | outro
  area_direito          VARCHAR(50), -- civel | bancario | consumidor | trabalhista | tributario
  descricao_caso        TEXT,
  status_pipeline       VARCHAR(50) NOT NULL DEFAULT 'primeiro_contato', -- primeiro_contato | consulta | proposta | fechado | perdido
  usuario_responsavel   UUID REFERENCES users(id),
  valor_estimado        DECIMAL(15,2),
  observacoes           TEXT,
  convertido_cliente_id UUID REFERENCES clientes(id),
  criado_em             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_interacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  usuario_id  UUID REFERENCES users(id),
  tipo        VARCHAR(50) NOT NULL, -- ligacao | reuniao | email | whatsapp | nota
  descricao   TEXT NOT NULL,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_prazos_processo ON prazos(processo_id);
CREATE INDEX IF NOT EXISTS idx_prazos_data ON prazos(data_prazo);
CREATE INDEX IF NOT EXISTS idx_prazos_concluido ON prazos(concluido);
CREATE INDEX IF NOT EXISTS idx_publicacoes_processo ON publicacoes(processo_id);
CREATE INDEX IF NOT EXISTS idx_publicacoes_lida ON publicacoes(lida);
CREATE INDEX IF NOT EXISTS idx_publicacoes_fonte ON publicacoes(fonte);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status_pipeline);
CREATE INDEX IF NOT EXISTS idx_leads_responsavel ON leads(usuario_responsavel);
