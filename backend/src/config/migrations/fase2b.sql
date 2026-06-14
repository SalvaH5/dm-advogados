-- ─────────────────────────────────────────
-- TAREFAS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tarefas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo        VARCHAR(255) NOT NULL,
  descricao     TEXT,
  tipo          VARCHAR(50) NOT NULL DEFAULT 'interna',
  processo_id   UUID REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id    UUID REFERENCES clientes(id) ON DELETE SET NULL,
  lead_id       UUID REFERENCES leads(id) ON DELETE SET NULL,
  usuario_id    UUID REFERENCES users(id),
  status        VARCHAR(50) NOT NULL DEFAULT 'a_fazer',
  prioridade    VARCHAR(20) NOT NULL DEFAULT 'media',
  data_vencimento DATE,
  concluida_em  TIMESTAMP WITH TIME ZONE,
  origem        VARCHAR(50) DEFAULT 'manual',
  criado_por    UUID REFERENCES users(id),
  criado_em     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tarefa_checklist (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tarefa_id   UUID NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
  item        VARCHAR(255) NOT NULL,
  concluido   BOOLEAN NOT NULL DEFAULT false,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- CHAT INTERNO
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_mensagens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  processo_id     UUID REFERENCES processos(id) ON DELETE CASCADE,
  cliente_id      UUID REFERENCES clientes(id) ON DELETE SET NULL,
  de_usuario_id   UUID NOT NULL REFERENCES users(id),
  para_usuario_id UUID REFERENCES users(id),
  conteudo        TEXT NOT NULL,
  tipo            VARCHAR(20) NOT NULL DEFAULT 'mensagem',
  lida            BOOLEAN NOT NULL DEFAULT false,
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- HISTÓRICO DE ATIVIDADES (timeline)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS historico_atividades (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id     UUID REFERENCES clientes(id) ON DELETE CASCADE,
  processo_id    UUID REFERENCES processos(id) ON DELETE SET NULL,
  lead_id        UUID REFERENCES leads(id) ON DELETE SET NULL,
  tipo_evento    VARCHAR(100) NOT NULL,
  modulo_origem  VARCHAR(50) NOT NULL,
  descricao      TEXT NOT NULL,
  referencia_id  UUID,
  usuario_id     UUID REFERENCES users(id),
  icone          VARCHAR(50),
  criado_em      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- AGENDA EVENTOS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agenda_eventos (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo           VARCHAR(255) NOT NULL,
  descricao        TEXT,
  tipo             VARCHAR(50) NOT NULL DEFAULT 'reuniao',
  data_inicio      TIMESTAMP WITH TIME ZONE NOT NULL,
  data_fim         TIMESTAMP WITH TIME ZONE,
  dia_todo         BOOLEAN NOT NULL DEFAULT false,
  processo_id      UUID REFERENCES processos(id) ON DELETE SET NULL,
  cliente_id       UUID REFERENCES clientes(id) ON DELETE SET NULL,
  lead_id          UUID REFERENCES leads(id) ON DELETE SET NULL,
  usuario_id       UUID NOT NULL REFERENCES users(id),
  local            VARCHAR(255),
  google_event_id  VARCHAR(255),
  outlook_event_id VARCHAR(255),
  cor              VARCHAR(20) DEFAULT 'blue',
  criado_em        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  atualizado_em    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PORTAL — MENSAGENS E SOLICITAÇÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portal_mensagens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES processos(id) ON DELETE SET NULL,
  remetente   VARCHAR(20) NOT NULL,
  conteudo    TEXT NOT NULL,
  lida        BOOLEAN NOT NULL DEFAULT false,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_solicitacoes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  processo_id UUID REFERENCES processos(id) ON DELETE SET NULL,
  assunto     VARCHAR(255) NOT NULL,
  descricao   TEXT,
  status      VARCHAR(50) NOT NULL DEFAULT 'pendente',
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS portal_tokens (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id  UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expira_em   TIMESTAMP WITH TIME ZONE NOT NULL,
  ativo       BOOLEAN NOT NULL DEFAULT true,
  criado_em   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LOG DE AUTOMAÇÕES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS automacoes_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  regra           VARCHAR(100) NOT NULL,
  trigger_evento  VARCHAR(100),
  acao_executada  VARCHAR(255),
  referencia_id   UUID,
  sucesso         BOOLEAN NOT NULL DEFAULT true,
  erro            TEXT,
  criado_em       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tarefas_processo ON tarefas(processo_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente ON tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario ON tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_vencimento ON tarefas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_chat_processo ON chat_mensagens(processo_id);
CREATE INDEX IF NOT EXISTS idx_historico_cliente ON historico_atividades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_historico_processo ON historico_atividades(processo_id);
CREATE INDEX IF NOT EXISTS idx_agenda_usuario ON agenda_eventos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_agenda_data ON agenda_eventos(data_inicio);
