import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import { calcularPrazo } from '../services/prazoService';

export async function criar(req: AuthRequest, res: Response) {
  try {
    const {
      processo_id, titulo, descricao, data_prazo, data_intimacao,
      tipo = 'processual', prioridade = 'media', dias_uteis = true,
      usuario_id
    } = req.body;

    if (!processo_id || !titulo || !data_prazo) {
      return res.status(400).json({ success: false, error: 'processo_id, titulo e data_prazo são obrigatórios' });
    }

    let dataPrazoFinal = new Date(data_prazo);

    if (data_intimacao && req.body.prazo_dias_uteis) {
      dataPrazoFinal = await calcularPrazo(new Date(data_intimacao), req.body.prazo_dias_uteis);
    }

    const result = await query(
      `INSERT INTO prazos (processo_id, usuario_id, titulo, descricao, data_prazo, data_intimacao, tipo, prioridade, dias_uteis, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [processo_id, usuario_id || req.user!.userId, titulo, descricao,
       dataPrazoFinal.toISOString().split('T')[0], data_intimacao,
       tipo, prioridade, dias_uteis, req.user!.userId]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Prazos criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { processo_id, concluido, prioridade, vencendo_em } = req.query;
    const params: unknown[] = [];
    let where = 'WHERE 1=1';
    let idx = 1;

    if (processo_id) { where += ` AND p.processo_id = $${idx++}`; params.push(processo_id); }
    if (concluido !== undefined) { where += ` AND p.concluido = $${idx++}`; params.push(concluido === 'true'); }
    if (prioridade) { where += ` AND p.prioridade = $${idx++}`; params.push(prioridade); }
    if (vencendo_em) {
      const dias = parseInt(vencendo_em as string);
      where += ` AND p.data_prazo <= CURRENT_DATE + INTERVAL '${dias} days'`;
    }

    const result = await query(
      `SELECT p.*, pr.numero_cnj, pr.tipo as processo_tipo,
              c.nome as cliente_nome, u.nome as responsavel_nome,
              (p.data_prazo - CURRENT_DATE) as dias_restantes
       FROM prazos p
       LEFT JOIN processos pr ON pr.id = p.processo_id
       LEFT JOIN clientes c ON c.id = pr.cliente_id
       LEFT JOIN users u ON u.id = p.usuario_id
       ${where}
       ORDER BY p.data_prazo ASC`,
      params
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Prazos listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function concluir(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `UPDATE prazos SET concluido = true, concluido_em = NOW(), atualizado_em = NOW()
       WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Prazo não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Prazos concluir error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function calcular(req: AuthRequest, res: Response) {
  try {
    const { data_inicio, dias_uteis } = req.body;
    if (!data_inicio || !dias_uteis) {
      return res.status(400).json({ success: false, error: 'data_inicio e dias_uteis são obrigatórios' });
    }
    const dataFim = await calcularPrazo(new Date(data_inicio), parseInt(dias_uteis));
    return res.json({ success: true, data: { data_fim: dataFim.toISOString().split('T')[0] } });
  } catch (err) {
    console.error('Prazos calcular error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function vencendoHoje(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT p.*, pr.numero_cnj, c.nome as cliente_nome, u.nome as responsavel_nome
       FROM prazos p
       LEFT JOIN processos pr ON pr.id = p.processo_id
       LEFT JOIN clientes c ON c.id = pr.cliente_id
       LEFT JOIN users u ON u.id = p.usuario_id
       WHERE p.data_prazo = CURRENT_DATE AND p.concluido = false
       ORDER BY p.prioridade DESC`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Prazos vencendoHoje error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
