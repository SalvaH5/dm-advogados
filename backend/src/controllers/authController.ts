import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { AuthRequest } from '../types';

export async function login(req: Request, res: Response) {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }
    const result = await query(
      'SELECT id, nome, email, senha_hash, role, permissoes, ativo FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = result.rows[0];
    if (!user || !user.ativo) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }
    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, permissoes: user.permissoes },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );
    await query(
      'INSERT INTO auditoria (usuario_id, acao, ip) VALUES ($1, $2, $3)',
      [user.id, 'login', req.ip]
    );
    return res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, nome: user.nome, email: user.email, role: user.role, permissoes: user.permissoes }
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function me(req: AuthRequest, res: Response) {
  try {
    const result = await query(
      'SELECT id, nome, email, role, permissoes, oab_numero, oab_estado FROM users WHERE id = $1',
      [req.user!.userId]
    );
    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Me error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}

export async function alterarSenha(req: AuthRequest, res: Response) {
  try {
    const { senhaAtual, novaSenha } = req.body;
    if (!senhaAtual || !novaSenha || novaSenha.length < 8) {
      return res.status(400).json({ success: false, error: 'Senha inválida (mínimo 8 caracteres)' });
    }
    const result = await query('SELECT senha_hash FROM users WHERE id = $1', [req.user!.userId]);
    const valida = await bcrypt.compare(senhaAtual, result.rows[0].senha_hash);
    if (!valida) return res.status(401).json({ success: false, error: 'Senha atual incorreta' });
    const novoHash = await bcrypt.hash(novaSenha, 12);
    await query('UPDATE users SET senha_hash = $1, atualizado_em = NOW() WHERE id = $2', [novoHash, req.user!.userId]);
    return res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (err) {
    console.error('AlterarSenha error:', err);
    return res.status(500).json({ success: false, error: 'Erro interno' });
  }
}
