import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function listarPorProcesso(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      `SELECT m.*, u.nome as de_usuario_nome
       FROM chat_mensagens m
       LEFT JOIN users u ON u.id = m.de_usuario_id
       WHERE m.processo_id = $1
       ORDER BY m.criado_em ASC`,
      [req.params.processo_id]
    );
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('Chat listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function enviar(req: AuthRequest, res: Response) {
  try {
    const { processo_id, cliente_id, conteudo, tipo = 'mensagem' } = req.body;
    if (!conteudo) return res.status(400).json({ success: false, error: 'conteudo é obrigatório' });

    const result = await query(
      `INSERT INTO chat_mensagens (processo_id, cliente_id, de_usuario_id, conteudo, tipo)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [processo_id || null, cliente_id || null, req.user!.userId, conteudo, tipo]
    );

    if (cliente_id || processo_id) {
      await query(
        `INSERT INTO historico_atividades (cliente_id, processo_id, tipo_evento, modulo_origem, descricao, referencia_id, usuario_id, icone)
         VALUES ($1,$2,'nota_adicionada','chat',$3,$4,$5,'message-circle')`,
        [cliente_id || null, processo_id || null, conteudo.substring(0, 100),
         result.rows[0].id, req.user!.userId]
      );
    }

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Chat enviar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
