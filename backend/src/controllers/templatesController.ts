import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { tipo, variacao } = req.query;
    let where = 'WHERE ativo = true';
    const params: unknown[] = [];
    let idx = 1;
    if (tipo)    { where += ` AND tipo = $${idx++}`;    params.push(tipo); }
    if (variacao){ where += ` AND variacao = $${idx++}`;params.push(variacao); }

    const result = await query(
      `SELECT t.*, u.nome as alterado_por_nome FROM templates t
       LEFT JOIN users u ON u.id = t.alterado_por
       ${where} ORDER BY t.tipo, t.variacao, t.nome`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Templates listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { nome, tipo, variacao, conteudo, variaveis = [] } = req.body;
    if (!nome || !tipo || !conteudo) {
      return res.status(400).json({ success: false, error: 'nome, tipo e conteudo são obrigatórios' });
    }
    const result = await query(
      `INSERT INTO templates (nome, tipo, variacao, conteudo, variaveis, alterado_por, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *`,
      [nome, tipo, variacao, conteudo, JSON.stringify(variaveis), req.user!.userId]
    );
    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Templates criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { nome, conteudo, variaveis, ativo } = req.body;

    const anterior = await query('SELECT versao, conteudo FROM templates WHERE id = $1', [id]);
    if (anterior.rows[0] && conteudo && conteudo !== anterior.rows[0].conteudo) {
      await query(
        'INSERT INTO templates_historico (template_id, versao, conteudo, alterado_por) VALUES ($1,$2,$3,$4)',
        [id, anterior.rows[0].versao, anterior.rows[0].conteudo, req.user!.userId]
      );
    }

    const result = await query(
      `UPDATE templates SET
        nome = COALESCE($1, nome),
        conteudo = COALESCE($2, conteudo),
        variaveis = COALESCE($3, variaveis),
        ativo = COALESCE($4, ativo),
        versao = versao + CASE WHEN $2 IS NOT NULL AND $2 != conteudo THEN 1 ELSE 0 END,
        alterado_por = $5,
        alterado_em = NOW()
       WHERE id = $6 RETURNING *`,
      [nome, conteudo, variaveis ? JSON.stringify(variaveis) : null, ativo, req.user!.userId, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Templates atualizar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function preencher(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { dados } = req.body;

    const result = await query('SELECT conteudo FROM templates WHERE id = $1 AND ativo = true', [id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Template não encontrado' });

    let conteudo = result.rows[0].conteudo;
    for (const [chave, valor] of Object.entries(dados)) {
      conteudo = conteudo.replace(new RegExp(`{{${chave}}}`, 'g'), String(valor));
    }

    return res.json({ success: true, data: { conteudo } });
  } catch (err) {
    console.error('Templates preencher error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function historico(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT th.*, u.nome as alterado_por_nome FROM templates_historico th
       LEFT JOIN users u ON u.id = th.alterado_por
       WHERE th.template_id = $1 ORDER BY th.versao DESC`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Templates historico error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
