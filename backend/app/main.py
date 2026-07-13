from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pathlib import Path

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.routers import auth, users, manuscripts, reviews, archive, admin
from app.routers import payments
from app.models.payment import Payment 


@asynccontextmanager
async def lifespan(app: FastAPI):
    import app.models  # noqa
    Base.metadata.create_all(bind=engine)
    _seed_initial_data()
    yield


def _seed_initial_data():
    from app.db.session import SessionLocal
    from app.models.user import User, UserRole
    from app.core.security import hash_password
    from app.routers.email_templates  import seed_default_templates
    from app.routers.journal_settings import seed_journal_settings
    from app.routers.subject_areas    import seed_subject_areas

    db = SessionLocal()
    try:
        # Admin account
        if not db.query(User).filter(User.email == settings.FIRST_ADMIN_EMAIL).first():
            db.add(User(
                email=settings.FIRST_ADMIN_EMAIL,
                hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
                name=settings.FIRST_ADMIN_NAME,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                is_approved=True,
            ))
            db.commit()
            print(f"[SEED] Created admin: {settings.FIRST_ADMIN_EMAIL}")

        # Editor-in-Chief account
        if not db.query(User).filter(User.email == settings.FIRST_EIC_EMAIL).first():
            db.add(User(
                email=settings.FIRST_EIC_EMAIL,
                hashed_password=hash_password(settings.FIRST_EIC_PASSWORD),
                name=settings.FIRST_EIC_NAME,
                role=UserRole.EDITOR_IN_CHIEF,
                is_active=True,
                is_verified=True,
                is_approved=True,
            ))
            db.commit()
            print(f"[SEED] Created editor-in-chief: {settings.FIRST_EIC_EMAIL}")

        seed_default_templates(db)
        seed_journal_settings(db)
        seed_subject_areas(db)

    except Exception as exc:
        db.rollback()
        print(f"[SEED ERROR] {exc}")
    finally:
        db.close()


limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

API = "/api/v1"
app.include_router(auth.router,        prefix=API)
app.include_router(users.router,       prefix=API)
app.include_router(manuscripts.router, prefix=API)
app.include_router(reviews.router,     prefix=API)
app.include_router(archive.router,     prefix=API)
app.include_router(admin.router,       prefix=API)
app.include_router(payments.router,   prefix=API)

# New routers
from app.routers.announcements    import router as announcements_router
from app.routers.email_templates  import router as email_templates_router
from app.routers.journal_settings import router as journal_settings_router
from app.routers.subject_areas    import router as subject_areas_router

app.include_router(announcements_router,   prefix=API)
app.include_router(email_templates_router, prefix=API)
app.include_router(journal_settings_router,prefix=API)
app.include_router(subject_areas_router,   prefix=API)


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "version": settings.APP_VERSION}

@app.get("/", tags=["Root"])
def root():
    return {"name": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/docs"}