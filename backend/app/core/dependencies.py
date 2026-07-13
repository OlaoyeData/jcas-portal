from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_token
from app.models.user import User, UserRole

oauth2_scheme = HTTPBearer()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    credentials=Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise exc
    user_id = payload.get("sub")
    if not user_id:
        raise exc
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise exc
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return current_user


def require_role(*roles: UserRole):
    def _check(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in roles and current_user.role != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access restricted. Required: {[r.value for r in roles]}",
            )
        return current_user
    return _check


# Convenience guards
def require_admin(user: User = Depends(require_role(UserRole.ADMIN))):
    return user

def require_editor_in_chief(
    user: User = Depends(require_role(UserRole.EDITOR_IN_CHIEF))
):
    return user

def require_any_editor(
    user: User = Depends(
        require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF)
    )
):
    """Allows both editor and editor_in_chief."""
    return user

def require_reviewer(user: User = Depends(require_role(UserRole.REVIEWER))):
    return user

# Legacy alias — keeps existing code working
def require_editor(user: User = Depends(require_role(UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF))):
    return user