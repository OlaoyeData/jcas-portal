"""Permanently delete a user account safely."""
from sqlalchemy import update, delete, select, func
from sqlalchemy.orm import Session

from app.db.base import Base
from app.models.user import User


class UserHasRecordsError(Exception):
    """Raised when the user still owns data that must not be lost (manuscripts, reviews...)."""
    def __init__(self, blockers: list):
        self.blockers = blockers
        super().__init__("User has linked records: " + ", ".join(blockers))


_FRIENDLY = {
    "manuscripts": "manuscripts",
    "review_assignments": "review assignments",
    "reviews": "reviews",
}


def permanently_delete_user(db: Session, user: User) -> None:
    """Delete the user row.

    - Columns that merely *reference* the user and allow NULL (assigned_by, created_by,
      confirmed_by, ...) are set to NULL so history is kept.
    - Their notifications are deleted.
    - If the user owns required records (manuscripts they submitted, reviews they were
      assigned), nothing is deleted and UserHasRecordsError is raised.
    """
    blockers, nullable_refs, delete_refs = [], [], []

    for table in Base.metadata.sorted_tables:
        for fk in table.foreign_keys:
            if fk.column.table.name != "users":
                continue
            col = fk.parent
            if table.name == "notifications":
                delete_refs.append(col)
            elif col.nullable:
                nullable_refs.append(col)
            else:
                count = db.execute(
                    select(func.count()).select_from(table).where(col == user.id)
                ).scalar()
                if count:
                    blockers.append(_FRIENDLY.get(table.name, table.name.replace("_", " ")))

    # A manuscript the user edits is also a record worth protecting? No: editor_id is
    # nullable, so it is simply unassigned below.

    if blockers:
        raise UserHasRecordsError(sorted(set(blockers)))

    try:
        for col in delete_refs:
            db.execute(delete(col.table).where(col == user.id))
        for col in nullable_refs:
            db.execute(update(col.table).where(col == user.id).values({col.name: None}))
        db.delete(user)
        db.commit()
    except Exception:
        db.rollback()
        raise
