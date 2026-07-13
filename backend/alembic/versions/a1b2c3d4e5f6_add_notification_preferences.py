"""add notification_preferences to users

Revision ID: a1b2c3d4e5f6
Revises: 5e92e81878a6
Create Date: 2026-07-13 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '5e92e81878a6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'users',
        sa.Column(
            'notification_preferences',
            postgresql.JSON(),
            nullable=False,
            server_default=sa.text(
                '\'{"notify_on_submission": true, "notify_on_review_complete": true, "notify_on_overdue": true, "notify_on_invitation": true}\'::json'
            ),
        ),
    )


def downgrade() -> None:
    op.drop_column('users', 'notification_preferences')