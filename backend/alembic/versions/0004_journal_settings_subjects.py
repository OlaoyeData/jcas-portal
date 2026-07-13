"""Add journal_settings and subject_areas tables

Revision ID: 0004_journal_settings_subjects
Revises: 0003_email_templates
Create Date: 2026-06-19
"""
from alembic import op
import sqlalchemy as sa

revision      = "0004_journal_settings_subjects"
down_revision = "0003_email_templates"
branch_labels = None
depends_on    = None


def upgrade() -> None:
    op.create_table(
        "journal_settings",
        sa.Column("id",                 sa.Integer(),     primary_key=True),
        sa.Column("name",               sa.String(255),   nullable=False),
        sa.Column("issn_online",        sa.String(20),    nullable=True),
        sa.Column("issn_print",         sa.String(20),    nullable=True),
        sa.Column("description",        sa.Text(),        nullable=True),
        sa.Column("review_model",       sa.String(20),    nullable=False, server_default="double_blind"),
        sa.Column("submissions_open",   sa.Boolean(),     nullable=False, server_default="true"),
        sa.Column("allowed_file_types", sa.String(100),   nullable=False, server_default="pdf,docx,zip"),
        sa.Column("max_upload_mb",      sa.Integer(),     nullable=False, server_default="50"),
        sa.Column("updated_at",         sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.func.now()),
    )

    op.create_table(
        "subject_areas",
        sa.Column("id",         sa.Integer(),              primary_key=True),
        sa.Column("name",       sa.String(200),            nullable=False),
        sa.Column("slug",       sa.String(200),            nullable=False, unique=True),
        sa.Column("is_active",  sa.Boolean(),              nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True,
                  server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("subject_areas")
    op.drop_table("journal_settings")

