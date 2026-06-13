import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { tribunal } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    if (tribunal) { where += ' AND tribunal = $1'; params.push(tribunal); }
    const result = await query(`SELECT * FROM perfis_vara ${where} ORDER BY tribunal, vara`, params);
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('PerfilVara listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { tribunal, vara, comarca, juiz_atual, observacoes, tendencias = {} } = req.body;
    if (!tribunal || !vara) return res.status(400).json({ success: false, error: 'tribunal e vara são obrigatórios' });
    const result = await query(
      `INSERT INTO perfis_vara (tribunal, vara, comarca, juiz_atual, observacoes, tendencias, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (tribunal, vara) DO UPDATE SET
         juiz_atual = EXCLUDED.juiz_atual,
         observacoes = EXCLUDED.observacoes,
         tendencias = EXCLUDED.tendencias,
         atualizado_em = NOW()
       RETURNING *`,
      [tribunal, vara, comarca, juiz_atual, observacoes, JSON.stringify(tendencias), req.user!.userId]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PerfilVara criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { juiz_atual, observacoes, tendencias } = req.body;
    const result = await query(
      `UPDATE perfis_vara SET
        juiz_atual = COALESCE($1, juiz_atual),
        observacoes = COALESCE($2, observacoes),
        tendencias = COALESCE($3, tendencias),
        usuario_id = $4,
        atualizado_em = NOW()
       WHERE id = $5 RETURNING *`,
      [juiz_atual, observacoes, tendencias ? JSON.stringify(tendencias) : null, req.user!.userId, id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Perfil não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('PerfilVara atualizar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
