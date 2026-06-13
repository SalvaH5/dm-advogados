import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import * as spacesService from '../services/spacesService';

export async function upload(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    const { processo_id, cliente_id, tipo, visivel_portal = false } = req.body;

    if (!file) return res.status(400).json({ success: false, error: 'Arquivo não enviado' });
    if (!cliente_id) return res.status(400).json({ success: false, error: 'cliente_id é obrigatório' });

    const { caminho } = await spacesService.uploadDocumento({
      buffer: file.buffer,
      mimeType: file.mimetype,
      nomeOriginal: file.originalname,
      clienteId: cliente_id,
      processoId: processo_id,
      tipo,
    });

    const result = await query(
      `INSERT INTO documentos (processo_id, cliente_id, nome, tipo, caminho_spaces, tamanho_bytes, mime_type, visivel_portal, enviado_por, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'advogado',$9) RETURNING id, nome, tipo, caminho_spaces, tamanho_bytes, criado_em`,
      [processo_id || null, cliente_id, file.originalname, tipo || 'outros',
       caminho, file.size, file.mimetype,
       visivel_portal === 'true' || visivel_portal === true,
       req.user!.userId]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Documentos upload error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { processo_id, cliente_id, visivel_portal } = req.query;
    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    let idx = 1;
    if (processo_id)    { where += ` AND processo_id = $${idx++}`;    params.push(processo_id); }
    if (cliente_id)     { where += ` AND cliente_id = $${idx++}`;     params.push(cliente_id); }
    if (visivel_portal !== undefined) { where += ` AND visivel_portal = $${idx++}`; params.push(visivel_portal === 'true'); }

    const result = await query(
      `SELECT d.*, u.nome as criado_por_nome FROM documentos d
       LEFT JOIN users u ON u.id = d.criado_por
       ${where} ORDER BY d.criado_em DESC`,
      params
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Documentos listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function obterUrl(req: AuthRequest, res: Response) {
  try {
    const result = await query('SELECT caminho_spaces FROM documentos WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Documento não encontrado' });
    const url = await spacesService.gerarUrlTemporaria(result.rows[0].caminho_spaces);
    return res.json({ success: true, data: { url } });
  } catch (err) {
    console.error('Documentos obterUrl error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function togglePortal(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `UPDATE documentos SET visivel_portal = NOT visivel_portal WHERE id = $1 RETURNING id, visivel_portal`,
      [req.params.id]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Toggle portal error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
