import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { calcularPrazo } from '../services/prazoService';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { lida, fonte, processo_id, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (lida !== undefined) { where += ` AND lida = $${idx++}`; params.push(lida === 'true'); }
    if (fonte) { where += ` AND fonte = $${idx++}`; params.push(fonte); }
    if (processo_id) { where += ` AND processo_id = $${idx++}`; params.push(processo_id); }

    params.push(Number(limit), offset);

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM publicacoes ${where}`, params.slice(0, idx - 1)),
      query(
        `SELECT pub.*, p.numero_cnj, c.nome as cliente_nome
         FROM publicacoes pub
         LEFT JOIN processos p ON p.id = pub.processo_id
         LEFT JOIN clientes c ON c.id = p.cliente_id
         ${where}
         ORDER BY pub.criado_em DESC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        params
      )
    ]);

    const total = parseInt(countResult.rows[0].count);
    return res.json({
      success: true,
      data: dataResult.rows,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) }
    });
  } catch (err) {
    console.error('Publicacoes listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function marcarLida(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `UPDATE publicacoes SET lida = true WHERE id = $1 RETURNING id, lida`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Publicacoes marcarLida error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { processo_id, numero_cnj, fonte = 'manual', tribunal, tipo_ato, conteudo, data_publicacao, prazo_dias } = req.body;
    if (!conteudo) return res.status(400).json({ success: false, error: 'conteudo é obrigatório' });

    let prazoData = null;
    if (prazo_dias && data_publicacao) {
      const dataFim = await calcularPrazo(new Date(data_publicacao), prazo_dias);
      prazoData = dataFim.toISOString().split('T')[0];
    }

    const result = await query(
      `INSERT INTO publicacoes (processo_id, numero_cnj, fonte, tribunal, tipo_ato, conteudo, data_publicacao, prazo_dias, prazo_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [processo_id || null, numero_cnj, fonte, tribunal, tipo_ato, conteudo, data_publicacao, prazo_dias, prazoData]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Publicacoes criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function naoLidas(req: AuthRequest, res: Response) {
  try {
    const result = await query(`SELECT COUNT(*) FROM publicacoes WHERE lida = false`);
    return res.json({ success: true, data: { total: parseInt(result.rows[0].count) } });
  } catch (err) {
    console.error('Publicacoes naoLidas error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
