import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { mes, ano, usuario_id } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (mes && ano) {
      where += ` AND EXTRACT(MONTH FROM data_inicio) = $${idx++} AND EXTRACT(YEAR FROM data_inicio) = $${idx++}`;
      params.push(mes, ano);
    }
    if (usuario_id) { where += ` AND usuario_id = $${idx++}`; params.push(usuario_id); }

    const result = await query(
      `SELECT a.*, c.nome as cliente_nome, p.numero_cnj, u.nome as usuario_nome
       FROM agenda_eventos a
       LEFT JOIN clientes c ON c.id = a.cliente_id
       LEFT JOIN processos p ON p.id = a.processo_id
       LEFT JOIN users u ON u.id = a.usuario_id
       ${where} ORDER BY a.data_inicio ASC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Agenda listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { titulo, descricao, tipo = 'reuniao', data_inicio, data_fim,
            dia_todo = false, processo_id, cliente_id, lead_id, local, cor = 'blue' } = req.body;
    if (!titulo || !data_inicio) {
      return res.status(400).json({ success: false, error: 'titulo e data_inicio são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO agenda_eventos (titulo, descricao, tipo, data_inicio, data_fim, dia_todo,
        processo_id, cliente_id, lead_id, usuario_id, local, cor)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [titulo, descricao, tipo, data_inicio, data_fim || null, dia_todo,
       processo_id || null, cliente_id || null, lead_id || null,
       req.user!.userId, local, cor]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Agenda criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { titulo, descricao, tipo, data_inicio, data_fim, local, cor } = req.body;
    const result = await query(
      `UPDATE agenda_eventos SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        tipo = COALESCE($3, tipo),
        data_inicio = COALESCE($4, data_inicio),
        data_fim = COALESCE($5, data_fim),
        local = COALESCE($6, local),
        cor = COALESCE($7, cor),
        atualizado_em = NOW()
       WHERE id = $8 AND usuario_id = $9 RETURNING *`,
      [titulo, descricao, tipo, data_inicio, data_fim, local, cor, id, req.user!.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Evento não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function deletar(req: AuthRequest, res: Response) {
  try {
    await query('DELETE FROM agenda_eventos WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.user!.userId]);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function proximos(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT a.*, c.nome as cliente_nome
       FROM agenda_eventos a
       LEFT JOIN clientes c ON c.id = a.cliente_id
       WHERE a.data_inicio >= NOW() AND a.data_inicio <= NOW() + INTERVAL '7 days'
       ORDER BY a.data_inicio ASC LIMIT 10`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
