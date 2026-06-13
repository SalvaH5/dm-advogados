import { Response } from 'express';
import { query } from '../config/database';
import { AuthRequest } from '../types';
import * as zapSignService from '../services/zapSignService';

export async function iniciar(req: AuthRequest, res: Response) {
  try {
    const { cliente_id, processo_id, templates_ids } = req.body;
    if (!cliente_id || !templates_ids?.length) {
      return res.status(400).json({ success: false, error: 'cliente_id e templates_ids são obrigatórios' });
    }

    const clienteResult = await query(
      `SELECT c.*, pgp_sym_decrypt(c.cpf_cnpj::bytea, $2) as cpf_cnpj_dec FROM clientes c WHERE c.id = $1`,
      [cliente_id, process.env.DB_CRYPTO_KEY || 'dm_crypto_key_local']
    );
    const cliente = clienteResult.rows[0];
    if (!cliente) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });

    const onboardingResult = await query(
      `INSERT INTO onboardings (cliente_id, processo_id, status, templates_usados, criado_por)
       VALUES ($1,$2,'documentos_gerados',$3,$4) RETURNING id`,
      [cliente_id, processo_id || null, JSON.stringify(templates_ids), req.user!.userId]
    );
    const onboardingId = onboardingResult.rows[0].id;

    const dados: Record<string, string> = {
      nome_cliente: cliente.nome,
      cpf: cliente.cpf_cnpj_dec || '',
      email: cliente.email || '',
      telefone: cliente.telefone || '',
      whatsapp: cliente.whatsapp || '',
      endereco: cliente.endereco ? JSON.stringify(cliente.endereco) : '',
      escritorio_nome: process.env.ESCRITORIO_NOME || 'Dias Menezes Advogados',
      escritorio_cnpj: process.env.ESCRITORIO_CNPJ || '',
      data_hoje: new Date().toLocaleDateString('pt-BR'),
    };

    const documentosGerados: string[] = [];
    for (const templateId of templates_ids) {
      const tResult = await query('SELECT * FROM templates WHERE id = $1 AND ativo = true', [templateId]);
      if (!tResult.rows[0]) continue;
      let conteudo = tResult.rows[0].conteudo;
      for (const [k, v] of Object.entries(dados)) {
        conteudo = conteudo.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }
      documentosGerados.push(conteudo);
    }

    return res.json({
      success: true,
      data: {
        onboarding_id: onboardingId,
        documentos_gerados: documentosGerados.length,
        status: 'documentos_gerados',
      }
    });
  } catch (err) {
    console.error('Onboarding iniciar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function enviarParaAssinatura(req: AuthRequest, res: Response) {
  try {
    const { onboarding_id, documentos_html } = req.body;

    const onboardingResult = await query(
      `SELECT o.*, c.nome as cliente_nome, c.email as cliente_email, c.whatsapp as cliente_whatsapp
       FROM onboardings o JOIN clientes c ON c.id = o.cliente_id WHERE o.id = $1`,
      [onboarding_id]
    );
    const onboarding = onboardingResult.rows[0];
    if (!onboarding) return res.status(404).json({ success: false, error: 'Onboarding não encontrado' });

    const doc = documentos_html[0];
    const zapResult = await zapSignService.criarDocumento({
      nome: doc.nome,
      conteudoBase64: Buffer.from(doc.conteudo_html).toString('base64'),
      signatarios: [{
        name: onboarding.cliente_nome,
        email: onboarding.cliente_email,
        phone_number: onboarding.cliente_whatsapp?.replace(/\D/g, ''),
      }],
      clienteNome: onboarding.cliente_nome,
    });

    await query(
      `UPDATE onboardings SET status = 'aguardando_assinatura', zapsign_envelope_id = $1, atualizado_em = NOW() WHERE id = $2`,
      [zapResult.token, onboarding_id]
    );

    return res.json({
      success: true,
      data: {
        zapsign_token: zapResult.token,
        sign_url: zapResult.sign_url,
        status: 'aguardando_assinatura',
      }
    });
  } catch (err) {
    console.error('Onboarding enviarParaAssinatura error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function webhookZapSign(req: AuthRequest, res: Response) {
  try {
    const { document_token, event_type, signed_file_url } = req.body;

    if (event_type !== 'doc_signed') {
      return res.json({ success: true, message: 'Evento ignorado' });
    }

    const onboardingResult = await query(
      `SELECT o.*, c.email as cliente_email FROM onboardings o
       JOIN clientes c ON c.id = o.cliente_id
       WHERE o.zapsign_envelope_id = $1`,
      [document_token]
    );
    const onboarding = onboardingResult.rows[0];
    if (!onboarding) return res.status(404).json({ success: false, error: 'Onboarding não encontrado' });

    await query(
      `UPDATE onboardings SET status = 'concluido', portal_liberado = true, atualizado_em = NOW() WHERE id = $1`,
      [onboarding.id]
    );

    if (signed_file_url) {
      await query(
        `INSERT INTO documentos (cliente_id, nome, tipo, caminho_spaces, mime_type, visivel_portal, enviado_por, zapsign_doc_token, zapsign_status, zapsign_signed_url)
         VALUES ($1, 'Documentos assinados - Onboarding', 'onboarding', $2, 'application/pdf', true, 'advogado', $3, 'signed', $4)`,
        [onboarding.cliente_id, signed_file_url, document_token, signed_file_url]
      );
    }

    console.log(`Onboarding ${onboarding.id} concluído — cliente ${onboarding.cliente_id}`);
    return res.json({ success: true });
  } catch (err) {
    console.error('Webhook ZapSign error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
