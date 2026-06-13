import { Response, Request } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { status, usuario_responsavel } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (status) { where += ` AND l.status_pipeline = $${idx++}`; params.push(status); }
    if (usuario_responsavel) { where += ` AND l.usuario_responsavel = $${idx++}`; params.push(usuario_responsavel); }

    const result = await query(
      `SELECT l.*, u.nome as responsavel_nome,
              COUNT(li.id) as total_interacoes
       FROM leads l
       LEFT JOIN users u ON u.id = l.usuario_responsavel
       LEFT JOIN lead_interacoes li ON li.lead_id = l.id
       ${where}
       GROUP BY l.id, u.nome
       ORDER BY l.atualizado_em DESC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Leads listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { nome, email, telefone, whatsapp, origem = 'site', area_direito, descricao_caso, usuario_responsavel } = req.body;
    if (!nome) return res.status(400).json({ success: false, error: 'nome é obrigatório' });

    const result = await query(
      `INSERT INTO leads (nome, email, telefone, whatsapp, origem, area_direito, descricao_caso, usuario_responsavel)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [nome, email, telefone, whatsapp, origem, area_direito, descricao_caso, usuario_responsavel || null]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Leads criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criarPublico(req: Request, res: Response) {
  try {
    const { nome, email, telefone, whatsapp, area_direito, descricao_caso } = req.body;
    if (!nome || !telefone) {
      return res.status(400).json({ success: false, error: 'nome e telefone são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO leads (nome, email, telefone, whatsapp, origem, area_direito, descricao_caso)
       VALUES ($1,$2,$3,$4,'site',$5,$6) RETURNING id, nome, criado_em`,
      [nome, email, telefone, whatsapp || telefone, area_direito, descricao_caso]
    );

    return res.status(201).json({
      success: true,
      message: 'Solicitação recebida com sucesso! Entraremos em contato em breve.',
      data: { id: result.rows[0].id }
    });
  } catch (err) {
    console.error('Leads criarPublico error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizarStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status_pipeline, observacoes } = req.body;

    const result = await query(
      `UPDATE leads SET
        status_pipeline = COALESCE($1, status_pipeline),
        observacoes = COALESCE($2, observacoes),
        atualizado_em = NOW()
       WHERE id = $3 RETURNING *`,
      [status_pipeline, observacoes, id]
    );

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Leads atualizarStatus error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function adicionarInteracao(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { tipo, descricao } = req.body;
    if (!tipo || !descricao) return res.status(400).json({ success: false, error: 'tipo e descricao são obrigatórios' });

    const result = await query(
      `INSERT INTO lead_interacoes (lead_id, usuario_id, tipo, descricao) VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, req.user!.userId, tipo, descricao]
    );

    await query(`UPDATE leads SET atualizado_em = NOW() WHERE id = $1`, [id]);

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Leads adicionarInteracao error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function converterEmCliente(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    const leadResult = await query('SELECT * FROM leads WHERE id = $1', [id]);
    const lead = leadResult.rows[0];
    if (!lead) return res.status(404).json({ success: false, error: 'Lead não encontrado' });

    const clienteResult = await query(
      `INSERT INTO clientes (nome, email, telefone, whatsapp, criado_por)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [lead.nome, lead.email, lead.telefone, lead.whatsapp, req.user!.userId]
    );

    const clienteId = clienteResult.rows[0].id;

    await query(
      `UPDATE leads SET status_pipeline = 'fechado', convertido_cliente_id = $1, atualizado_em = NOW() WHERE id = $2`,
      [clienteId, id]
    );

    return res.json({ success: true, data: { cliente_id: clienteId } });
  } catch (err) {
    console.error('Leads converterEmCliente error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function kanban(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT l.*, u.nome as responsavel_nome,
              COUNT(li.id) as total_interacoes
       FROM leads l
       LEFT JOIN users u ON u.id = l.usuario_responsavel
       LEFT JOIN lead_interacoes li ON li.lead_id = l.id
       GROUP BY l.id, u.nome
       ORDER BY l.atualizado_em DESC`
    );

    const stages = ['primeiro_contato', 'consulta', 'proposta', 'fechado', 'perdido'];
    const kanbanData: Record<string, unknown[]> = {};
    stages.forEach(s => { kanbanData[s] = []; });
    result.rows.forEach(lead => {
      if (kanbanData[lead.status_pipeline]) {
        kanbanData[lead.status_pipeline].push(lead);
      }
    });

    return res.json({ success: true, data: kanbanData });
  } catch (err) {
    console.error('Leads kanban error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
