import { Response } from 'express';
import crypto from 'crypto';
import { query } from '../config/database';
import { AuthRequest } from '../types';

function hashCpf(cpf: string): string {
  return crypto.createHash('sha256').update(cpf.replace(/\D/g, '')).digest('hex');
}

export async function criar(req: AuthRequest, res: Response) {
  try {
    const {
      nome, cpf_cnpj, tipo_pessoa = 'fisica', email, telefone, whatsapp,
      endereco, data_nascimento, profissao, estado_civil, observacoes
    } = req.body;

    if (!nome) return res.status(400).json({ success: false, error: 'Nome é obrigatório' });

    let cpfCnpjCrypt = null;
    let cpfCnpjHash = null;
    if (cpf_cnpj) {
      const cpfLimpo = cpf_cnpj.replace(/\D/g, '');
      cpfCnpjHash = hashCpf(cpfLimpo);
      const cryptResult = await query(
        `SELECT pgp_sym_encrypt($1, $2) as encrypted`,
        [cpfLimpo, process.env.DB_CRYPTO_KEY || 'dm_crypto_key_local']
      );
      cpfCnpjCrypt = cryptResult.rows[0].encrypted;
    }

    const result = await query(
      `INSERT INTO clientes (nome, cpf_cnpj, cpf_cnpj_hash, tipo_pessoa, email, telefone,
        whatsapp, endereco, data_nascimento, profissao, estado_civil, observacoes, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, nome, tipo_pessoa, email, telefone, whatsapp, criado_em`,
      [nome, cpfCnpjCrypt, cpfCnpjHash, tipo_pessoa, email, telefone,
       whatsapp, endereco ? JSON.stringify(endereco) : null,
       data_nascimento, profissao, estado_civil, observacoes, req.user!.userId]
    );

    return res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Clientes criar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function listar(req: AuthRequest, res: Response) {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let whereClause = 'WHERE c.ativo = true';
    const params: unknown[] = [];
    let paramIdx = 1;

    if (q) {
      whereClause += ` AND (c.nome ILIKE $${paramIdx} OR c.email ILIKE $${paramIdx})`;
      params.push(`%${q}%`);
      paramIdx++;
    }

    params.push(Number(limit), offset);

    const [countResult, dataResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM clientes c ${whereClause}`, params.slice(0, paramIdx - 1)),
      query(
        `SELECT c.id, c.nome, c.tipo_pessoa, c.email, c.telefone, c.whatsapp,
                c.criado_em,
                COUNT(p.id) as total_processos
         FROM clientes c
         LEFT JOIN processos p ON p.cliente_id = c.id AND p.status = 'ativo'
         ${whereClause}
         GROUP BY c.id
         ORDER BY c.nome ASC
         LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
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
    console.error('Clientes listar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function buscarPorId(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT c.*,
              pgp_sym_decrypt(c.cpf_cnpj::bytea, $2) as cpf_cnpj_decrypted,
              COUNT(DISTINCT p.id) as total_processos,
              COUNT(DISTINCT d.id) as total_documentos
       FROM clientes c
       LEFT JOIN processos p ON p.cliente_id = c.id
       LEFT JOIN documentos d ON d.cliente_id = c.id
       WHERE c.id = $1 AND c.ativo = true
       GROUP BY c.id`,
      [id, process.env.DB_CRYPTO_KEY || 'dm_crypto_key_local']
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Clientes buscarPorId error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function atualizar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, whatsapp, endereco, data_nascimento, profissao, estado_civil, observacoes } = req.body;
    const result = await query(
      `UPDATE clientes SET
        nome = COALESCE($1, nome),
        email = COALESCE($2, email),
        telefone = COALESCE($3, telefone),
        whatsapp = COALESCE($4, whatsapp),
        endereco = COALESCE($5, endereco),
        data_nascimento = COALESCE($6, data_nascimento),
        profissao = COALESCE($7, profissao),
        estado_civil = COALESCE($8, estado_civil),
        observacoes = COALESCE($9, observacoes),
        atualizado_em = NOW()
       WHERE id = $10 AND ativo = true
       RETURNING id, nome, email, telefone, atualizado_em`,
      [nome, email, telefone, whatsapp,
       endereco ? JSON.stringify(endereco) : null,
       data_nascimento, profissao, estado_civil, observacoes, id]
    );
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Cliente não encontrado' });
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Clientes atualizar error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function ocrCnh(req: AuthRequest, res: Response) {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ success: false, error: 'Imagem da CNH não enviada' });

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const base64 = file.buffer.toString('base64');
    const mediaType = file.mimetype as 'image/jpeg' | 'image/png' | 'image/webp';

    const response = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL_SIMPLES || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Extraia os dados desta CNH brasileira e retorne APENAS um JSON válido sem markdown, sem explicações, no seguinte formato:
{
  "nome": "Nome completo conforme CNH",
  "cpf": "000.000.000-00",
  "data_nascimento": "DD/MM/AAAA",
  "rg": "número do RG se visível",
  "endereco": {
    "logradouro": "",
    "numero": "",
    "complemento": "",
    "bairro": "",
    "cidade": "",
    "estado": "UF",
    "cep": ""
  },
  "numero_registro": "número de registro da CNH",
  "validade": "DD/MM/AAAA"
}
Se algum campo não estiver visível, retorne string vazia.`
          }
        ]
      }]
    });

    const textContent = response.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      return res.status(500).json({ success: false, error: 'Falha ao extrair dados da CNH' });
    }

    const dados = JSON.parse(textContent.text);
    return res.json({ success: true, data: dados });
  } catch (err) {
    console.error('OCR CNH error:', err);
    return res.status(500).json({ success: false, error: 'Erro ao processar imagem da CNH' });
  }
}
