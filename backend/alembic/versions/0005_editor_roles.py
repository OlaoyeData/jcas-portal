"""Add editor_in_chief role, is_approved to users, editor_invitations table

Revision ID: 0005_editor_roles
Revises: 0004_journal_settings_subjects
Create Date: 2026-06-20
"""
from alembic import op
import sqlalchemy as sa

revision      = "0005_editor_roles"
down_revision = "0004_journal_settings_subjects"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    # Add new enum value to PostgreSQL enum type (safe to re-run)
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'editor_in_chief'")

    # Add is_approved column — skip if it already exists
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT true
    """)

    # Create editor_invitations table — skip if it already exists
    op.execute("""
        CREATE TABLE IF NOT EXISTS editor_invitations (
            id          SERIAL PRIMARY KEY,
            email       VARCHAR(255) NOT NULL,
            name        VARCHAR(255) NOT NULL,
            role        VARCHAR(50)  NOT NULL DEFAULT 'editor',
            token       VARCHAR(255) NOT NULL UNIQUE,
            invited_by  INTEGER REFERENCES users(id),
            is_used     BOOLEAN      NOT NULL DEFAULT false,
            created_at  TIMESTAMPTZ  DEFAULT NOW(),
            expires_at  TIMESTAMPTZ  NOT NULL,
            accepted_at TIMESTAMPTZ
        )
    """)

    # Add cover_image_url to journal_settings — skip if it already exists
    op.execute("""
        ALTER TABLE journal_settings
        ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500)
    """)


def downgrade() -> None:
    op.drop_column("journal_settings", "cover_image_url")
    op.drop_table("editor_invitations")
    op.drop_column("users", "is_approved")