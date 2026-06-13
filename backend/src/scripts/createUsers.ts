import bcrypt from 'bcrypt';
import { pool } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function createUsers() {
  const users = [
    {
      nome: 'Salvador Dias Neto',
      email: 'salvador@diasmenezes.adv.br',
      senha: 'DmSalvador2025!',
      role: 'admin',
      oab_numero: '123456',
      oab_estado: 'SP',
    },
    {
      nome: 'Rafael Ferreira Menezes da Costa',
      email: 'rafael@diasmenezes.adv.br',
      senha: 'DmRafael2025!',
      role: 'admin',
      oab_numero: '654321',
      oab_estado: 'SP',
    },
  ];

  const permissoes = {
    clientes:   { ler: true, criar: true, editar: true, deletar: true },
    processos:  { ler: true, criar: true, editar: true, deletar: true },
    documentos: { ler: true, criar: true, editar: true, deletar: true },
    templates:  { ler: true, criar: true, editar: true, deletar: true },
    financeiro: { ler: true, criar: true, editar: true },
    usuarios:   { ler: true, criar: true, editar: true },
    auditoria:  { ler: true },
  };

  for (const user of users) {
    const hash = await bcrypt.hash(user.senha, 12);
    const result = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, role, permissoes, oab_numero, oab_estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (email) DO UPDATE SET
         nome = EXCLUDED.nome,
         senha_hash = EXCLUDED.senha_hash,
         role = EXCLUDED.role,
         permissoes = EXCLUDED.permissoes,
         oab_numero = EXCLUDED.oab_numero,
         oab_estado = EXCLUDED.oab_estado
       RETURNING id, nome, email`,
      [user.nome, user.email, hash, user.role, JSON.stringify(permissoes), user.oab_numero, user.oab_estado]
    );
    console.log(`✅ Usuário criado/atualizado: ${result.rows[0].nome} (${result.rows[0].email})`);
    console.log(`   Senha: ${user.senha}`);
  }

  await pool.end();
  console.log('\n✅ Usuários criados com sucesso!');
}

createUsers().catch(console.error);
