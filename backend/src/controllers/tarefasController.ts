import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { processo_id, cliente_id, status, usuario_id, data_inicio, data_fim } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (processo_id) { where += ` AND t.processo_id = $${idx++}`; params.push(processo_id); }
    if (cliente_id)  { where += ` AND t.cliente_id = $${idx++}`;  params.push(cliente_id); }
    if (status)      { where += ` AND t.status = $${idx++}`;      params.push(status); }
    if (usuario_id)  { where += ` AND t.usuario_id = $${idx++}`;  params.push(usuario_id); }
    if (data_inicio) { where += ` AND t.data_vencimento >= $${idx++}`; params.push(data_inicio); }
    if (data_fim)    { where += ` AND t.data_vencimento <= $${idx++}`; params.push(data_fim); }

    const result = await query(
      `SELECT t.*,
              p.numero_cnj, p.tipo as processo_tipo,
              c.nome as cliente_nome,
              u.nome as responsavel_nome,
              (t.data_vencimento - CURRENT_DATE) as dias_restantes
       FROM tarefas t
       LEFT JOIN processos p ON p.id = t.processo_id
       LEFT JOIN clientes c ON c.id = COALESCE(t.cliente_id, p.cliente_id)
       LEFT JOIN users u ON u.id = t.usuario_id
       ${where}
       ORDER BY t.data_vencimento ASC NULLS LAST, t.prioridade DESC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Tarefas listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const { titulo, descricao, tipo = 'interna', processo_id, cliente_id, lead_id,
            usuario_id, prioridade = 'media', data_vencimento } = req.body;
    if (!titulo) return res.status(400).json({ success: false, error: 'titulo é obrigatório' });

    const result = await query(
      `INSERT INTO tarefas (titulo, descricao, tipo, processo_id, cliente_id, lead_id,
        usuario_id, prioridade, data_vencimento, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [titulo, descricao, tipo, processo_id || null, cliente_id || null, lead_id || null,
       usuario_id || req.user!.userId, prioridade, data_vencimento || null, req.user!.userId]
    );

    if (cliente_id || processo_id) {
      await query(
        `INSERT INTO historico_atividades (cliente_id, processo_id, tipo_evento, modulo_origem, descricao, referencia_id, usuario_id, icone)
         VALUES ($1,$2,'tarefa_criada','tarefas',$3,$4,$5,'check-square')`,
        [cliente_id || null, processo_id || null, `Tarefa criada: ${titulo}`,
         result.rows[0].id, req.user!.userId]
      );
    }

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Tarefas criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizarStatus(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const setConcluida = status === 'concluida'
      ? 'concluida_em = NOW(),'
      : 'concluida_em = NULL,';
    const result = await query(
      `UPDATE tarefas SET status = $1, ${setConcluida} atualizado_em = NOW()
       WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Tarefas atualizarStatus error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { titulo, descricao, prioridade, data_vencimento, usuario_id } = req.body;
    const result = await query(
      `UPDATE tarefas SET
        titulo = COALESCE($1, titulo),
        descricao = COALESCE($2, descricao),
        prioridade = COALESCE($3, prioridade),
        data_vencimento = COALESCE($4, data_vencimento),
        usuario_id = COALESCE($5, usuario_id),
        atualizado_em = NOW()
       WHERE id = $6 RETURNING *`,
      [titulo, descricao, prioridade, data_vencimento, usuario_id, id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function kanban(req: AuthRequest, res: Response) {
  try {
    const { usuario_id } = req.query;
    const params: unknown[] = [];
    let where = "WHERE t.status != 'cancelada'";
    if (usuario_id) { where += ' AND t.usuario_id = $1'; params.push(usuario_id); }

    const result = await query(
      `SELECT t.*, c.nome as cliente_nome, p.numero_cnj, u.nome as responsavel_nome
       FROM tarefas t
       LEFT JOIN clientes c ON c.id = COALESCE(t.cliente_id, (SELECT cliente_id FROM processos WHERE id = t.processo_id))
       LEFT JOIN processos p ON p.id = t.processo_id
       LEFT JOIN users u ON u.id = t.usuario_id
       ${where} ORDER BY t.data_vencimento ASC NULLS LAST`,
      params
    );

    const stages = ['a_fazer', 'em_andamento', 'aguardando', 'concluida'];
    const kanbanResult: Record<string, unknown[]> = {};
    stages.forEach(s => { kanbanResult[s] = []; });
    result.rows.forEach(t => { if (kanbanResult[t.status]) kanbanResult[t.status].push(t); });

    return res.json({ success: true, data: kanbanResult });
  } catch (err) {
    console.error('Tarefas kanban error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
