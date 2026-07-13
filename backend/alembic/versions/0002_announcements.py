"""Add announcements table

Revision ID: 0002_announcements
Revises: 0001_initial
Create Date: 2026-06-18 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision      = "0002_announcements"
down_revision = "0001_initial"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    op.create_table(
        "announcements",
        sa.Column("id",         sa.Integer(),      primary_key=True),
        sa.Column("title",      sa.String(255),    nullable=False),
        sa.Column("message",    sa.Text(),         nullable=False),
        sa.Column("type",       sa.String(20),     nullable=False, server_default="info"),
        sa.Column("is_active",  sa.Boolean(),      nullable=False, server_default="true"),
        sa.Column("link",       sa.String(500),    nullable=True),
        sa.Column("link_text",  sa.String(100),    nullable=True),
        sa.Column("created_by", sa.Integer(),      sa.ForeignKey("users.id"), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("announcements")