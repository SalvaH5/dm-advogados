import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function criar(req: AuthRequest, res: Response) {
  try {
    const {
      cliente_id, numero_cnj, tipo, tribunal, vara, comarca,
      status = 'ativo', fase_processual, data_distribuicao, valor_causa,
      polo_ativo, polo_passivo, campos_especificos = {}, advogado_responsavel
    } = req.body;

    if (!cliente_id || !tipo) {
      return res.status(400).json({ success: false, error: 'cliente_id e tipo são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO processos (cliente_id, numero_cnj, tipo, tribunal, vara, comarca,
        status, fase_processual, data_distribuicao, valor_causa, polo_ativo, polo_passivo,
        campos_especificos, advogado_responsavel, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [cliente_id, numero_cnj, tipo, tribunal, vara, comarca,
       status, fase_processual, data_distribuicao, valor_causa, polo_ativo, polo_passivo,
       JSON.stringify(campos_especificos),
       advogado_responsavel || req.user!.userId, req.user!.userId]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Processos criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { cliente_id, tipo, status, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params: unknown[] = [];
    let whereClause = 'WHERE 1=1';
    let idx = 1;

    if (cliente_id) { whereClause += ` AND p.cliente_id = $${idx++}`; params.push(cliente_id); }
    if (tipo)       { whereClause += ` AND p.tipo = $${idx++}`;       params.push(tipo); }
    if (status)     { whereClause += ` AND p.status = $${idx++}`;     params.push(status); }

    params.push(Number(limit), offset);

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM processos p ${whereClause}`, params.slice(0, idx - 1)),
      query(
        `SELECT p.*, c.nome as cliente_nome, u.nome as advogado_nome
         FROM processos p
         LEFT JOIN clientes c ON c.id = p.cliente_id
         LEFT JOIN users u ON u.id = p.advogado_responsavel
         ${whereClause}
         ORDER BY p.criado_em DESC
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
    console.error('Processos listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function buscarPorId(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT p.*, c.nome as cliente_nome, u.nome as advogado_nome,
              pv.observacoes as vara_observacoes, pv.tendencias as vara_tendencias,
              pv.juiz_atual
       FROM processos p
       LEFT JOIN clientes c ON c.id = p.cliente_id
       LEFT JOIN users u ON u.id = p.advogado_responsavel
       LEFT JOIN perfis_vara pv ON pv.tribunal = p.tribunal AND pv.vara = p.vara
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Processo não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Processos buscarPorId error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const campos = req.body;
    const result = await query(
      `UPDATE processos SET
        numero_cnj = COALESCE($1, numero_cnj),
        tribunal = COALESCE($2, tribunal),
        vara = COALESCE($3, vara),
        status = COALESCE($4, status),
        fase_processual = COALESCE($5, fase_processual),
        campos_especificos = COALESCE($6, campos_especificos),
        resumo_ia = COALESCE($7, resumo_ia),
        resultado_final = COALESCE($8, resultado_final),
        resultado_observacoes = COALESCE($9, resultado_observacoes),
        encerrado_em = COALESCE($10, encerrado_em),
        atualizado_em = NOW()
       WHERE id = $11
       RETURNING *`,
      [campos.numero_cnj, campos.tribunal, campos.vara, campos.status,
       campos.fase_processual,
       campos.campos_especificos ? JSON.stringify(campos.campos_especificos) : null,
       campos.resumo_ia, campos.resultado_final, campos.resultado_observacoes,
       campos.encerrado_em, id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Processo não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Processos atualizar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function adicionarResultado(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { tipo = 'parcial', subtipo, descricao, data_resultado, fase_processual } = req.body;
    if (!data_resultado) return res.status(400).json({ success: false, error: 'data_resultado é obrigatório' });

    const result = await query(
      `INSERT INTO processo_resultados (processo_id, tipo, subtipo, descricao, data_resultado, fase_processual, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, tipo, subtipo, descricao, data_resultado, fase_processual, req.user!.userId]
    );

    if (tipo === 'final') {
      await query(
        `UPDATE processos SET resultado_final = $1, resultado_observacoes = $2, encerrado_em = $3, status = 'encerrado', atualizado_em = NOW() WHERE id = $4`,
        [subtipo, descricao, data_resultado, id]
      );
    }

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Resultado error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
