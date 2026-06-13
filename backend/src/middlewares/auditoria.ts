import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { query } from '../config/database';

export function auditar(acao: string, tabela?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode < 400 && req.user) {
        const registroId = body?.data?.id || req.params?.id;
        query(
          `INSERT INTO auditoria (usuario_id, acao, tabela, registro_id, dados, ip)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            req.user.userId,
            acao,
            tabela || null,
            registroId || null,
            JSON.stringify({ body: req.body, params: req.params }),
            req.ip
          ]
        ).catch(console.error);
      }
      return originalJson(body);
    };
    next();
  };
}
