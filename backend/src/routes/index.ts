import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { auditar } from '../middlewares/auditoria';
import multer from 'multer';

import * as authCtrl from '../controllers/authController';
import * as clientesCtrl from '../controllers/clientesController';
import * as processosCtrl from '../controllers/processosController';
import * as templatesCtrl from '../controllers/templatesController';
import * as documentosCtrl from '../controllers/documentosController';
import * as onboardingCtrl from '../controllers/onboardingController';
import * as perfilVaraCtrl from '../controllers/perfilVaraController';
import * as prazosCtrl from '../controllers/prazosController';
import * as publicacoesCtrl from '../controllers/publicacoesController';
import * as leadsCtrl from '../controllers/leadsController';
import * as dashboardCtrl from '../controllers/dashboardController';
import * as tarefasCtrl from '../controllers/tarefasController';
import * as agendaCtrl from '../controllers/agendaController';
import * as chatCtrl from '../controllers/chatController';
import * as historicoCtrl from '../controllers/historicoController';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── AUTH ──────────────────────────────────────────
router.post('/auth/login',          authCtrl.login);
router.get ('/auth/me',             authenticate, authCtrl.me);
router.put ('/auth/senha',          authenticate, authCtrl.alterarSenha);

// ── DASHBOARD ─────────────────────────────────────
router.get ('/dashboard/stats',     authenticate, dashboardCtrl.stats);

// ── CLIENTES ──────────────────────────────────────
router.get ('/clientes',            authenticate, authorize('clientes','ler'),   clientesCtrl.listar);
router.post('/clientes',            authenticate, authorize('clientes','criar'),  auditar('create','clientes'), clientesCtrl.criar);
router.get ('/clientes/:id',        authenticate, authorize('clientes','ler'),   clientesCtrl.buscarPorId);
router.put ('/clientes/:id',        authenticate, authorize('clientes','editar'), auditar('update','clientes'), clientesCtrl.atualizar);
router.post('/clientes/ocr-cnh',    authenticate, upload.single('imagem'),       clientesCtrl.ocrCnh);

// ── PROCESSOS ─────────────────────────────────────
router.get ('/processos',           authenticate, authorize('processos','ler'),   processosCtrl.listar);
router.post('/processos',           authenticate, authorize('processos','criar'),  auditar('create','processos'), processosCtrl.criar);
router.get ('/processos/:id',       authenticate, authorize('processos','ler'),   processosCtrl.buscarPorId);
router.put ('/processos/:id',       authenticate, authorize('processos','editar'), auditar('update','processos'), processosCtrl.atualizar);
router.post('/processos/:id/resultado', authenticate, authorize('processos','editar'), auditar('create','processo_resultados'), processosCtrl.adicionarResultado);

// ── TEMPLATES ─────────────────────────────────────
router.get ('/templates',           authenticate, authorize('templates','ler'),   templatesCtrl.listar);
router.post('/templates',           authenticate, authorize('templates','criar'),  auditar('create','templates'), templatesCtrl.criar);
router.put ('/templates/:id',       authenticate, authorize('templates','editar'), auditar('update','templates'), templatesCtrl.atualizar);
router.post('/templates/:id/preencher', authenticate, templatesCtrl.preencher);
router.get ('/templates/:id/historico', authenticate, templatesCtrl.historico);

// ── DOCUMENTOS ────────────────────────────────────
router.post('/documentos/upload',   authenticate, authorize('documentos','criar'), upload.single('arquivo'), auditar('create','documentos'), documentosCtrl.upload);
router.get ('/documentos',          authenticate, authorize('documentos','ler'),   documentosCtrl.listar);
router.get ('/documentos/:id/url',  authenticate, authorize('documentos','ler'),   documentosCtrl.obterUrl);
router.put ('/documentos/:id/portal', authenticate, authorize('documentos','editar'), documentosCtrl.togglePortal);

// ── ONBOARDING ────────────────────────────────────
router.post('/onboarding/iniciar',          authenticate, onboardingCtrl.iniciar);
router.post('/onboarding/assinar',          authenticate, onboardingCtrl.enviarParaAssinatura);
router.post('/onboarding/webhook/zapsign',  onboardingCtrl.webhookZapSign);

// ── PERFIS DE VARAS ───────────────────────────────
router.get ('/varas',               authenticate, perfilVaraCtrl.listar);
router.post('/varas',               authenticate, auditar('create','perfis_vara'), perfilVaraCtrl.criar);
router.put ('/varas/:id',           authenticate, auditar('update','perfis_vara'), perfilVaraCtrl.atualizar);

// ── PRAZOS ────────────────────────────────────────
router.get ('/prazos/vencendo-hoje',    authenticate, prazosCtrl.vencendoHoje);
router.post('/prazos/calcular',         authenticate, prazosCtrl.calcular);
router.get ('/prazos',                  authenticate, prazosCtrl.listar);
router.post('/prazos',                  authenticate, auditar('create','prazos'), prazosCtrl.criar);
router.put ('/prazos/:id/concluir',     authenticate, auditar('update','prazos'), prazosCtrl.concluir);

// ── PUBLICAÇÕES ───────────────────────────────────
router.get ('/publicacoes/nao-lidas',   authenticate, publicacoesCtrl.naoLidas);
router.get ('/publicacoes',             authenticate, publicacoesCtrl.listar);
router.post('/publicacoes',             authenticate, auditar('create','publicacoes'), publicacoesCtrl.criar);
router.put ('/publicacoes/:id/lida',    authenticate, publicacoesCtrl.marcarLida);

// ── LEADS ─────────────────────────────────────────
router.get ('/leads/kanban',                authenticate, leadsCtrl.kanban);
router.get ('/leads',                       authenticate, leadsCtrl.listar);
router.post('/leads',                       authenticate, auditar('create','leads'), leadsCtrl.criar);
router.put ('/leads/:id/status',            authenticate, auditar('update','leads'), leadsCtrl.atualizarStatus);
router.post('/leads/:id/interacoes',        authenticate, leadsCtrl.adicionarInteracao);
router.post('/leads/:id/converter',         authenticate, auditar('update','leads'), leadsCtrl.converterEmCliente);

// ── LEADS — ROTA PÚBLICA ──────────────────────────
router.post('/publico/leads',               leadsCtrl.criarPublico);

// ── TAREFAS ───────────────────────────────────────
router.get ('/tarefas/kanban',           authenticate, tarefasCtrl.kanban);
router.get ('/tarefas',                  authenticate, tarefasCtrl.listar);
router.post('/tarefas',                  authenticate, auditar('create','tarefas'), tarefasCtrl.criar);
router.put ('/tarefas/:id',              authenticate, auditar('update','tarefas'), tarefasCtrl.atualizar);
router.put ('/tarefas/:id/status',       authenticate, tarefasCtrl.atualizarStatus);

// ── AGENDA ────────────────────────────────────────
router.get ('/agenda/proximos',          authenticate, agendaCtrl.proximos);
router.get ('/agenda',                   authenticate, agendaCtrl.listar);
router.post('/agenda',                   authenticate, auditar('create','agenda_eventos'), agendaCtrl.criar);
router.put ('/agenda/:id',               authenticate, agendaCtrl.atualizar);
router.delete('/agenda/:id',             authenticate, agendaCtrl.deletar);

// ── CHAT ──────────────────────────────────────────
router.get ('/chat/processo/:processo_id', authenticate, chatCtrl.listarPorProcesso);
router.post('/chat',                       authenticate, chatCtrl.enviar);

// ── HISTÓRICO ─────────────────────────────────────
router.get ('/historico/cliente/:cliente_id',   authenticate, historicoCtrl.listarPorCliente);
router.get ('/historico/processo/:processo_id', authenticate, historicoCtrl.listarPorProcesso);
router.post('/historico',                        authenticate, historicoCtrl.registrar);

export default router;
