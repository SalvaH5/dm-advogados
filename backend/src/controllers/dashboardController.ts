import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function stats(req: AuthRequest, res: Response) {
  try {
    const [clientes, processos, documentos, prazos, publicacoes, leads] = await Promise.all([
      query(`SELECT COUNT(*) FROM clientes WHERE ativo = true`),
      query(`SELECT COUNT(*) FROM processos WHERE status = 'ativo'`),
      query(`SELECT COUNT(*) FROM documentos`),
      query(`SELECT COUNT(*) FROM prazos WHERE concluido = false AND data_prazo >= CURRENT_DATE AND data_prazo <= CURRENT_DATE + 7`),
      query(`SELECT COUNT(*) FROM publicacoes WHERE lida = false`),
      query(`SELECT COUNT(*) FROM leads WHERE status_pipeline NOT IN ('fechado', 'perdido')`),
    ]);

    return res.json({
      success: true,
      data: {
        clientes_ativos:   parseInt(clientes.rows[0].count),
        processos_ativos:  parseInt(processos.rows[0].count),
        total_documentos:  parseInt(documentos.rows[0].count),
        prazos_proximos:   parseInt(prazos.rows[0].count),
        publicacoes_novas: parseInt(publicacoes.rows[0].count),
        leads_ativos:      parseInt(leads.rows[0].count),
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
