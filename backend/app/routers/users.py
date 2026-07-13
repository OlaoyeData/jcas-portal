from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.dependencies import (
    get_db, get_current_active_user, require_admin, require_editor_in_chief,
)
from app.core.security import hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.user import UserOut, UserUpdate, UserSummary, UserAdminUpdate, UserPasswordChange

router = APIRouter(prefix="/users", tags=["Users"])


# ── Own profile ──────────────────────────────────────────────────────────

@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.patch("/me", response_model=UserOut)
def update_my_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    data = payload.model_dump(exclude_unset=True)
    if "notification_preferences" in data and data["notification_preferences"] is not None:
        merged = dict(current_user.notification_preferences or {})
        merged.update(data.pop("notification_preferences"))
        current_user.notification_preferences = merged
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/change-password", status_code=200)
def change_password(
    payload: UserPasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"detail": "Password changed successfully"}


# ── Reviewer directory (editors can browse) ──────────────────────────────

@router.get("/reviewers", response_model=List[UserSummary])
def list_reviewers(
    search: Optional[str] = Query(None),
    expertise: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_active_user),
):
    q = db.query(User).filter(
        User.role == UserRole.REVIEWER,
        User.is_active.is_(True),
        User.is_approved.is_(True),
    )
    if search:
        q = q.filter(
            User.name.ilike(f"%{search}%") | User.affiliation.ilike(f"%{search}%")
        )
    if expertise:
        q = q.filter(User.expertise_areas.ilike(f"%{expertise}%"))
    return q.order_by(User.name).all()

@router.get("/editors", response_model=List[UserOut])
def list_editors(
    db: Session = Depends(get_db),
    _: User = Depends(require_editor_in_chief),
):
    """All registered editors and editors-in-chief, for the EiC dashboard."""
    return (
        db.query(User)
        .filter(
            User.role.in_([UserRole.EDITOR, UserRole.EDITOR_IN_CHIEF]),
            User.is_active.is_(True),
        )
        .order_by(User.name)
        .all()
    )


# ── Reviewer registration approval (editor-in-chief) ──────────────────────

@router.get("/pending-reviewers", response_model=List[UserOut])
def list_pending_reviewers(
    db: Session = Depends(get_db),
    _: User = Depends(require_editor_in_chief),
):
    """Reviewers who self-registered and are awaiting editorial approval."""
    return (
        db.query(User)
        .filter(
            User.role == UserRole.REVIEWER,
            User.is_approved.is_(False),
            User.is_active.is_(True),
        )
        .order_by(User.created_at.desc())
        .all()
    )


@router.post("/{user_id}/approve-reviewer", response_model=UserOut)
def approve_reviewer(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor_in_chief),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != UserRole.REVIEWER:
        raise HTTPException(status_code=400, detail="User is not a reviewer registration")
    user.is_approved = True
    db.commit()
    db.refresh(user)

    from app.services.manuscript_service import notify_user
    notify_user(
        db, user.id, "reviewer_approved",
        "Your Reviewer Account Has Been Approved",
        "The editorial team has approved your reviewer registration. You can now log in and review manuscripts.",
    )
    return user


@router.post("/{user_id}/reject-reviewer", status_code=200)
def reject_reviewer(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_editor_in_chief),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != UserRole.REVIEWER:
        raise HTTPException(status_code=400, detail="User is not a reviewer registration")
    # Reject: deactivate the account so they cannot log in.
    user.is_active = False
    user.is_approved = False
    db.commit()
    return {"detail": "Reviewer registration rejected"}


# ── Admin endpoints ──────────────────────────────────────────────────────

@router.get("/", response_model=List[UserOut])
def list_all_users(
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if is_active is not None:
        q = q.filter(User.is_active == is_active)
    return q.offset(skip).limit(limit).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/{user_id}", response_model=UserOut)
def admin_update_user(
    user_id: int,
    payload: UserAdminUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
    user.is_active = False
    db.commit()