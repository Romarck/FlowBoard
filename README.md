# FlowBoard

Agile Project Management System -- a self-hosted, open-source alternative inspired by Jira Software.

## Features (MVP)

- **Auth & RBAC** — Register, login, JWT refresh tokens, roles (Admin, Project Manager, Developer, Viewer)
- **Project Management** — CRUD de projetos, convite de membros, workflow de status customizável, labels
- **Issue Hierarchy** — Epic > Story > Task > Bug > Subtask com numeração automática (FB-1, FB-2...)
- **Kanban Board** — Drag-and-drop entre colunas e reordenação via @dnd-kit
- **Backlog Management** — Agrupamento por Epic, filtros, criação inline
- **Sprint Management** — Ciclo planning → active → completed, métricas de sprint
- **Comments & Activity** — Comentários em issues com edição/exclusão e timestamps relativos
- **File Attachments** — Upload de arquivos com preview de imagens
- **Global Search & Filters** — Busca fulltext, filtros avançados, filtros salvos
- **Dashboard & Metrics** — Métricas por projeto, distribuição por tipo/prioridade, workload da equipe
- **Real-time Notifications** — WebSocket por usuário, badge de não-lidas, mark as read

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript (Vite) + Tailwind CSS v4 |
| State / Data | Zustand + TanStack React Query v5 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15 |
| ORM | SQLAlchemy 2.0 (async) + Alembic |
| Auth | JWT (access + refresh tokens) |
| Real-time | WebSocket nativo FastAPI |
| Testing | Vitest + React Testing Library (frontend) / pytest (backend) |

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- Git

## Quick Start

1. **Clone and enter the project directory:**

   ```bash
   cd flowboard
   ```

2. **Create environment file for backend:**

   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Start all services:**

   ```bash
   make dev
   # or: docker compose up
   ```

4. **Access the application:**

   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs (Swagger): http://localhost:8000/docs
   - Health check: http://localhost:8000/health

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services (db, backend, frontend) |
| `make dev-build` | Start with forced rebuild |
| `make stop` | Stop all services |
| `make test` | Run backend and frontend tests |
| `make lint` | Run linters (ruff for Python, eslint for TypeScript) |
| `make migrate` | Run Alembic database migrations |
| `make clean` | Stop services and remove volumes |

## Project Structure

```
flowboard/
├── backend/
│   ├── app/
│   │   ├── auth/              # JWT auth, login, register, refresh
│   │   ├── projects/          # Projects, members, workflow statuses, labels, metrics
│   │   ├── issues/            # Issues CRUD, move, history, relations
│   │   ├── sprints/           # Sprint lifecycle (planning → active → completed)
│   │   ├── comments/          # Issue comments
│   │   ├── attachments/       # File upload/download
│   │   ├── notifications/     # WebSocket notifications
│   │   ├── search/            # Global search, saved filters
│   │   └── common/            # Shared permissions, deps
│   ├── tests/                 # 106 pytest tests (all modules)
│   ├── alembic/               # Database migrations
│   ├── pyproject.toml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios API clients por módulo
│   │   ├── components/        # UI components (board/, backlog/, sprints/, issues/, dashboard/, comments/, notifications/)
│   │   ├── hooks/             # React Query hooks por módulo
│   │   ├── pages/             # Pages (auth/, projects/, board/, backlog/, sprints/, dashboard/)
│   │   ├── store/             # Zustand stores (auth)
│   │   ├── types/             # TypeScript interfaces
│   │   └── utils/             # date.ts e outros utilitários
│   ├── package.json
│   ├── vite.config.ts         # Vite + Vitest config
│   └── Dockerfile
├── docker-compose.yml
├── Makefile
└── .github/workflows/         # CI pipeline
```

## Development

### Backend

O backend reinicia automaticamente em mudanças de arquivo (uvicorn `--reload`).

```bash
# Rodar todos os testes (106 testes)
cd backend
python -m pytest tests/ -v

# Rodar testes com cobertura
python -m pytest tests/ --cov=app --cov-report=term-missing

# Linter
ruff check app/

# Migrations
make migrate
```

### Frontend

O frontend usa Vite HMR para hot-reload instantâneo.

```bash
cd frontend

# Servidor de desenvolvimento
npm run dev

# Rodar testes (93 testes — Vitest + React Testing Library)
npm test

# Testes com relatório de cobertura
npm run test:coverage

# UI interativa do Vitest
npm run test:ui

# Type checking
npm run typecheck

# Linter
npm run lint
```

### Database

PostgreSQL roda na porta **5433** (mapeada internamente para 5432) com os seguintes defaults:

- Database: `flowboard`
- User: `flowboard`
- Password: `flowboard_dev`

Conectar diretamente:

```bash
docker compose exec db psql -U flowboard -d flowboard
# ou via porta exposta no host:
psql -h localhost -p 5433 -U flowboard -d flowboard
```

### Seed de Dados

```bash
docker compose exec backend python -m app.seed
```

## API Docs

Com os serviços rodando, a documentação Swagger está disponível em:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## CI/CD

GitHub Actions roda em todo push e pull request para `main`:

- **Backend**: Ruff lint + pytest (106 testes)
- **Frontend**: ESLint + TypeScript type checking + Vitest (93 testes)

## Contributing

1. Crie uma branch a partir de `main`
2. Siga os padrões do projeto (service layer no backend, React Query no frontend)
3. Escreva testes para novas features
4. Garanta que `make lint` e `make test` passam
5. Abra um pull request

## Architecture

Veja `docs/architecture-flowboard.md` para o documento de arquitetura completo (ADRs, schema SQL, component tree).

## License

Private project.
