"""Add email_templates table

Revision ID: 0003_email_templates
Revises: 0002_announcements
Create Date: 2026-06-19 00:00:00
"""
from alembic import op
import sqlalchemy as sa

revision      = "0003_email_templates"
down_revision = "0002_announcements"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    op.create_table(
        "email_templates",
        sa.Column("id",         sa.Integer(),     primary_key=True),
        sa.Column("key",        sa.String(100),   nullable=False,  unique=True),
        sa.Column("label",      sa.String(200),   nullable=False),
        sa.Column("subject",    sa.String(500),   nullable=False),
        sa.Column("body",       sa.Text(),        nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.func.now()),
        sa.Column("updated_by", sa.Integer(),
                  sa.ForeignKey("users.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("email_templates")