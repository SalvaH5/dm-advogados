import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listarPorCliente(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT h.*, u.nome as usuario_nome
       FROM historico_atividades h
       LEFT JOIN users u ON u.id = h.usuario_id
       WHERE h.cliente_id = $1
       ORDER BY h.criado_em DESC
       LIMIT 50`,
      [req.params.cliente_id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function listarPorProcesso(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT h.*, u.nome as usuario_nome
       FROM historico_atividades h
       LEFT JOIN users u ON u.id = h.usuario_id
       WHERE h.processo_id = $1
       ORDER BY h.criado_em DESC
       LIMIT 50`,
      [req.params.processo_id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function registrar(req: AuthRequest, res: Response) {
  try {
    const { cliente_id, processo_id, tipo_evento, modulo_origem, descricao, referencia_id, icone } = req.body;
    const result = await query(
      `INSERT INTO historico_atividades (cliente_id, processo_id, tipo_evento, modulo_origem, descricao, referencia_id, usuario_id, icone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [cliente_id || null, processo_id || null, tipo_evento, modulo_origem,
       descricao, referencia_id || null, req.user!.userId, icone || 'activity']
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
