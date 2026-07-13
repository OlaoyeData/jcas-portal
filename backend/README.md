# JCAS Backend — FastAPI + PostgreSQL

REST API for the Journal of Computing & Applied Sciences editorial management system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.111 |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Auth | JWT (python-jose) + bcrypt |
| Validation | Pydantic v2 |
| Containerisation | Docker + Docker Compose |

---

## Project Structure

```
jcas-backend/
├── app/
│   ├── main.py               # FastAPI app factory, middleware, lifespan
│   ├── core/
│   │   ├── config.py         # Pydantic settings (reads .env)
│   │   ├── security.py       # JWT helpers, password hashing
│   │   └── dependencies.py   # FastAPI Depends (auth, roles, DB)
│   ├── db/
│   │   ├── base.py           # SQLAlchemy DeclarativeBase
│   │   └── session.py        # Engine + SessionLocal
│   ├── models/
│   │   ├── user.py           # User, UserRole
│   │   ├── manuscript.py     # Manuscript, ManuscriptAuthor, ManuscriptFile
│   │   ├── review.py         # ReviewAssignment, Review
│   │   └── article.py        # Volume, Issue, Article, Notification
│   ├── schemas/
│   │   ├── auth.py           # Login/register request & response schemas
│   │   ├── user.py           # User Pydantic models
│   │   ├── manuscript.py     # Manuscript Pydantic models
│   │   ├── review.py         # Review Pydantic models
│   │   └── article.py        # Volume/Issue/Article Pydantic models
│   ├── routers/
│   │   ├── auth.py           # /api/v1/auth/*
│   │   ├── users.py          # /api/v1/users/*
│   │   ├── manuscripts.py    # /api/v1/manuscripts/*
│   │   ├── reviews.py        # /api/v1/reviews/*
│   │   ├── archive.py        # /api/v1/volumes|issues|articles|search|notifications
│   │   └── admin.py          # /api/v1/admin/*
│   ├── services/
│   │   └── manuscript_service.py   # ID generation, status transitions, notifications
│   └── utils/
│       ├── files.py          # File upload handler
│       └── email.py          # SMTP email helpers
├── alembic/
│   ├── env.py
│   └── versions/
│       └── 0001_initial.py   # Full schema creation migration
├── tests/
│   ├── conftest.py           # SQLite test fixtures
│   ├── test_auth.py          # Auth endpoint tests
│   └── test_manuscripts.py   # Manuscript endpoint tests
├── seed.py                   # Dev data seeder
├── docker-compose.yml
├── Dockerfile
├── alembic.ini
├── requirements.txt
└── .env.example
```

---

## Quick Start (Docker — Recommended)

### 1. Copy the environment file
```bash
cp .env.example .env
# Edit .env and set a strong SECRET_KEY:
#   openssl rand -hex 32
```

### 2. Start all services
```bash
docker-compose up -d
```
This starts:
- **PostgreSQL** on port `5432`
- **pgAdmin** on port `5050` (optional DB browser)
- **FastAPI API** on port `8000`

### 3. Apply migrations
```bash
docker-compose exec api alembic upgrade head
```

### 4. Seed development data
```bash
docker-compose exec api python seed.py
```

### 5. Open the API docs
- Swagger UI: http://localhost:8000/docs
- ReDoc:       http://localhost:8000/redoc
- Health:      http://localhost:8000/health

---

## Quick Start (Local — Without Docker)

### Prerequisites
- Python 3.11+
- PostgreSQL 14+ running locally

### 1. Create virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Set DATABASE_URL to point at your local PostgreSQL, e.g.:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/jcas_db
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE jcas_db;"
psql -U postgres -c "CREATE USER jcas_user WITH PASSWORD 'jcas_secret';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE jcas_db TO jcas_user;"
```

### 4. Run migrations
```bash
alembic upgrade head
```

### 5. Seed data
```bash
python seed.py
```

### 6. Start the server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@jcas.edu | Admin@2024 |
| Editor | editor@jcas.edu | Editor@2024 |
| Author | author@jcas.edu | Author@2024 |
| Reviewer | reviewer@jcas.edu | Review@2024 |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login → JWT tokens |
| POST | `/api/v1/auth/refresh` | Exchange refresh → new access token |
| GET  | `/api/v1/auth/me` | Get current user profile |
| POST | `/api/v1/auth/password-reset/request` | Send reset email |
| POST | `/api/v1/auth/password-reset/confirm` | Apply new password |

### Manuscripts
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET  | `/api/v1/manuscripts/my` | Author | List own manuscripts |
| POST | `/api/v1/manuscripts/` | Author | Create draft |
| GET  | `/api/v1/manuscripts/{id}` | Owner/Editor | Get manuscript |
| PATCH| `/api/v1/manuscripts/{id}` | Owner/Editor | Update draft |
| POST | `/api/v1/manuscripts/{id}/submit` | Author | Submit for review |
| POST | `/api/v1/manuscripts/{id}/resubmit` | Author | Submit revision |
| POST | `/api/v1/manuscripts/{id}/files` | Author | Upload file |
| DELETE| `/api/v1/manuscripts/{id}` | Author | Withdraw |
| GET  | `/api/v1/manuscripts/` | Editor | List all submissions |
| POST | `/api/v1/manuscripts/{id}/assign-editor` | Editor | Assign editor |
| POST | `/api/v1/manuscripts/{id}/send-to-review` | Editor | Send to peer review |
| POST | `/api/v1/manuscripts/{id}/decision` | Editor | Accept/reject/revise |

### Reviews
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/reviews/assignments` | Editor | Invite reviewer |
| GET  | `/api/v1/reviews/my-invitations` | Reviewer | Pending invitations |
| GET  | `/api/v1/reviews/my-active` | Reviewer | Active reviews |
| POST | `/api/v1/reviews/assignments/{id}/respond` | Reviewer | Accept/decline |
| PUT  | `/api/v1/reviews/assignments/{id}/review` | Reviewer | Save/submit review |
| GET  | `/api/v1/reviews/manuscript/{id}/reviews` | Editor | All reviews |

### Archive (Public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/volumes` | All volumes + issues |
| GET | `/api/v1/volumes/{v}/issues/{i}/articles` | Articles in an issue |
| GET | `/api/v1/articles/{id}` | Single article |
| GET | `/api/v1/articles/doi/{doi}` | Article by DOI |
| GET | `/api/v1/search?q=...` | Full-text search |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/stats/overview` | System-wide metrics |
| GET | `/api/v1/admin/stats/submissions-by-month` | Monthly trends |
| GET | `/api/v1/admin/stats/review-turnaround` | Avg decision time |
| GET | `/api/v1/admin/audit-log` | Status change history |

---

## Manuscript Status Workflow

```
DRAFT → SUBMITTED → EDITOR_ASSIGNED → UNDER_REVIEW
                                            ↓
                               ┌── ACCEPTED → PUBLISHED
                               ├── REJECTED
                               └── REVISION_REQUIRED → REVISION_SUBMITTED
                                                              ↓
                                                        UNDER_REVIEW (again)
```

---

## Running Tests

```bash
# Install test dependencies (already in requirements.txt)
pytest -v

# With coverage
pip install pytest-cov
pytest --cov=app --cov-report=html
```

Tests use an **in-memory SQLite database** — no PostgreSQL needed for testing.

---

## Connect to Frontend

Set your frontend `.env`:
```
VITE_API_URL=http://localhost:8000/api/v1
```

Update `src/contexts/AuthContext.jsx` to call the real API instead of the mock.
