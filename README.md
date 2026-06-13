# DM Advogados — Sistema de Gestão Jurídica

## Desenvolvimento local

### Pré-requisitos
- Docker Desktop
- Node.js 20+
- Git

### Setup

1. Clone o repositório:
   ```
   git clone https://github.com/SalvaH5/dm-advogados.git
   cd dm-advogados
   ```

2. Configure o backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   ```

3. Configure o frontend:
   ```
   cd ../frontend
   cp .env.example .env
   npm install
   ```

4. Suba o banco e Redis:
   ```
   cd ..
   docker compose up -d
   ```

5. Inicie o backend:
   ```
   cd backend && npm run dev
   ```

6. Inicie o frontend (outro terminal):
   ```
   cd frontend && npm run dev
   ```

### URLs
- Frontend: http://localhost:5173
- Backend:  http://localhost:3001
- Health:   http://localhost:3001/health

### Login inicial
- Email: admin@diasmenezes.adv.br
- Senha: DmAdmin2025! (trocar no primeiro acesso)
